import {
  PieceName,
  type ChessPiece,
  type ClassicGameInfo,
} from "@/types/game.js";
import {
  bishopMoves,
  dangerArea,
  defaultSetup,
  encodeBoard,
  encodePosition,
  getLetterPiece,
  getPieces,
  getX,
  getXY,
  getY,
  kingMoves,
  knightMoves,
  pawnMoves,
  queenMoves,
  rookMoves,
  willCheck,
} from "@/chess/chess.js";

type Moves = { [key: number]: number[] };
/**
 * - 0: White wins
 * - 1: Black wins
 * - 2: Draw
 * - null: Game is still ongoing
 */
type GameState = 0 | 1 | 2 | null;
export interface ClassicServerGameRequest {
  // Square where the piece to move is located
  pieceToMove: number;
  // Square where the piece should be moved
  moveToPosition: number;
  // If the move is a promotion indicates the requested piece
  promotion?: "q" | "r" | "b" | "n";
}
export interface ClassicServerGameResponse {
  // FEN notation of the new board
  board: string;
  moves: Moves;
  state: GameState;
}
export class ClassicGameEngine {
  private game: ClassicGameInfo;
  private state: GameState = null;
  private moves: Moves = {};
  private positions: string[] = [];

  constructor(setup?: ClassicGameInfo) {
    if (setup) {
      this.game = setup;
      this.positions.push(encodePosition(this.game.board));
      this.generateMoves();
    } else {
      // Deep copy to avoid modifying the defaultSetup (a shallow copy might not be enought)
      this.game = JSON.parse(JSON.stringify(defaultSetup));
      this.positions.push(encodePosition(this.game.board));
      this.generateMoves();
    }
  }
  info() {
    return {
      game: this.game,
      state: this.state,
      moves: this.moves,
    };
  }
  response(): ClassicServerGameResponse {
    return {
      state: this.state,
      board: encodeBoard(this.game),
      moves: this.moves,
    };
  }
  request(req: ClassicServerGameRequest) {
    const validpromotionPieces = ["q", "r", "b", "n"];
    const { pieceToMove, moveToPosition } = req;
    let { promotion } = req;
    // Safety checks
    // Checks if pieceToMove is a valid key in moves
    if (this.moves[pieceToMove] === undefined) {
      throw new Error("Inexistant piece key");
    }
    // Checks if moveToPosition is a valid move for the given piece
    if (!this.moves[pieceToMove].includes(moveToPosition)) {
      throw new Error("Impossible move");
    }
    // If an unhandled promotion is specified replace it by a Queen
    if (promotion && !validpromotionPieces.includes(promotion)) {
      promotion = "q";
    }
    // If the game is already over don't process the move
    if (this.state !== null) {
      throw new Error("Game has ended, no moves can be played");
    }
    const piece = this.game.board[pieceToMove] as ChessPiece;

    // If the move results in a capture reset the halfMoveClock else increment it
    if (this.game.board[moveToPosition] !== null) {
      this.game.halfMoveClock = 0;
    } else {
      this.game.halfMoveClock++;
    }

    switch (piece.name) {
      case PieceName.King:
        this.game.passantPawn = undefined;
        const xMouvement = getX(moveToPosition) - getX(pieceToMove);
        // The king can only move 2 squares when it castles
        if (Math.abs(xMouvement) > 1) {
          // King castles King side
          if (xMouvement > 0) {
            // King move
            this.game.board[moveToPosition] = piece;
            this.game.board[pieceToMove] = null;
            // Rook move
            if (this.game.whiteToPlay) {
              this.game.board[63] = null;
              this.game.board[61] = { name: PieceName.Rook, white: true };
            } else {
              this.game.board[7] = null;
              this.game.board[5] = { name: PieceName.Rook, white: false };
            }
          }
          // King castles Queen side
          if (xMouvement < 0) {
            // King move
            this.game.board[moveToPosition] = piece;
            this.game.board[pieceToMove] = null;
            // Rook move
            if (this.game.whiteToPlay) {
              this.game.board[56] = null;
              this.game.board[59] = { name: PieceName.Rook, white: true };
            } else {
              this.game.board[0] = null;
              this.game.board[3] = { name: PieceName.Rook, white: false };
            }
          }
        } else {
          // Normal King move
          this.game.board[moveToPosition] = piece;
          this.game.board[pieceToMove] = null;
        }
        // Removing the ability to castle for the player
        if (this.game.whiteToPlay) {
          this.game.canWhiteCastleKingSide = false;
          this.game.canWhiteCastleQueenSide = false;
        } else {
          this.game.canBlackCastleKingSide = false;
          this.game.canBlackCastleQueenSide = false;
        }
        break;
      case PieceName.Rook:
        this.game.passantPawn = undefined;
        // For each starting rook positions, if the rook moves and it's castle is available, disable it
        // White King side
        if (pieceToMove === 63 && this.game.canWhiteCastleKingSide) {
          this.game.canWhiteCastleKingSide = false;
        }
        // White Queen side
        if (pieceToMove === 56 && this.game.canWhiteCastleQueenSide) {
          this.game.canWhiteCastleQueenSide = false;
        }
        // Black Queen side
        if (pieceToMove === 0 && this.game.canBlackCastleQueenSide) {
          this.game.canBlackCastleQueenSide = false;
        }
        // Black King side
        if (pieceToMove === 7 && this.game.canBlackCastleKingSide) {
          this.game.canBlackCastleKingSide = false;
        }
        // Normal Rook move
        this.game.board[moveToPosition] = piece;
        this.game.board[pieceToMove] = null;
        break;
      case PieceName.Pawn:
        // Any pawn move resets the halfMoveClock
        this.game.halfMoveClock = 0;
        const promotionLine = this.game.whiteToPlay ? 0 : 7;
        // promotion
        if (getY(moveToPosition) === promotionLine) {
          this.game.board[pieceToMove] = null;
          this.game.board[moveToPosition] = {
            // If promotion is defined we asume that we will get a piece from getLetterPiece()
            name: promotion
              ? (getLetterPiece(promotion) as PieceName)
              : PieceName.Queen,
            white: this.game.whiteToPlay,
          };
          break;
        }
        // En passant move
        const pawnMoveDirection = this.game.whiteToPlay ? -1 : 1;
        if (
          this.game.passantPawn &&
          getY(moveToPosition) ===
            getY(this.game.passantPawn) + pawnMoveDirection
        ) {
          this.game.board[this.game.passantPawn] = null;
          this.game.passantPawn = undefined;
          this.game.board[moveToPosition] = piece;
          this.game.board[pieceToMove] = null;
          break;
        }
        // If the pawn jumped 2 squares add him as an en passant target
        if (Math.abs(getX(moveToPosition) - getX(pieceToMove))) {
          this.game.passantPawn = moveToPosition;
          this.game.board[moveToPosition] = piece;
          this.game.board[pieceToMove] = null;
        } else {
          // Normal Pawn move
          this.game.passantPawn = undefined;
          this.game.board[moveToPosition] = piece;
          this.game.board[pieceToMove] = null;
        }
        break;
      // Normal piece movement case
      default:
        this.game.passantPawn = undefined;
        this.game.board[moveToPosition] = piece;
        this.game.board[pieceToMove] = null;
        break;
    }
    // Checking for insufficient material stalemate
    const piecesOnBoard = this.game.board.filter((e) => e !== null);
    // If there are only 2 pieces on the board the game is a draw
    // It implies that the only pieces are the 2 kings since they can't be captured
    if (piecesOnBoard.length < 3) {
      this.state = 2;
      return;
    }
    const leftBlackPieces = piecesOnBoard
      .filter((e) => e.white === false)
      .map((e) => e.name);
    const leftWhitePieces = piecesOnBoard
      .filter((e) => e.white === true)
      .map((e) => e.name);

    function isInsufficientMaterial(pieces: PieceName[]) {
      // there is enought material to checkmate
      if (pieces.length > 3) {
        return false;
      }
      // Only 2 knights and a king
      if (pieces.length === 3) {
        return (
          pieces.reduce(
            (acc, e) => acc + (e === PieceName.Knight ? 1 : 0),
            0
          ) === 2
        );
      }
      // Only a king and a bishop or a knight
      if (pieces.length === 2) {
        return (
          pieces.includes(PieceName.Bishop) || pieces.includes(PieceName.Knight)
        );
      }
      if (pieces.length === 1) {
        return true;
      }
    }
    // If there is insufficient material for both players the game is a draw
    if (
      isInsufficientMaterial(leftBlackPieces) &&
      isInsufficientMaterial(leftWhitePieces)
    ) {
      this.state = 2;
      return;
    }
    // Checking for repetition stalemate
    const newPosition = encodePosition(this.game.board);
    let repeatedPositions = 0;
    for (let i = 0; i < this.positions.length; i++) {
      const position = this.positions[i];
      if (position === newPosition) {
        repeatedPositions++;
      }
    }
    // If the new position is found more than 2 times the game is a draw
    if (repeatedPositions > 2) {
      this.state = 2;
      return;
    }
    // Generate moves for the next player
    this.game.whiteToPlay = !this.game.whiteToPlay;
    this.generateMoves();
    // Records the new position
    this.positions.push(newPosition);
  }
  generateMoves() {
    const moves: Moves = {};
    const myPieces = getPieces(this.game.board, this.game.whiteToPlay);
    const ennemyPieces = getPieces(this.game.board, !this.game.whiteToPlay);
    const danger = dangerArea(this.game.whiteToPlay, this.game.board);
    const check = danger.includes(
      this.game.board.findIndex(
        (i) => i?.name === PieceName.King && i.white === this.game.whiteToPlay
      )
    );

    const canCastleQueenSide = this.game.whiteToPlay
      ? this.game.canWhiteCastleQueenSide
      : this.game.canBlackCastleQueenSide;
    const canCastleKingSide = this.game.whiteToPlay
      ? this.game.canWhiteCastleKingSide
      : this.game.canBlackCastleKingSide;
    // Loop through all of the player's pieces and add any possible moves
    for (let i = 0; i < myPieces.length; i++) {
      const piecePos = myPieces[i];
      // We got the piece position from getPieces so the piece can't be null
      const pieceName = this.game.board[piecePos]?.name;
      const pieceCoord = getXY(piecePos);
      let pieceMoves: number[] = [];
      switch (pieceName) {
        case PieceName.King:
          pieceMoves = kingMoves(
            pieceCoord,
            this.game.whiteToPlay,
            myPieces,
            canCastleQueenSide,
            canCastleKingSide,
            danger
          );
          break;
        case PieceName.Queen:
          pieceMoves = queenMoves(pieceCoord, myPieces, ennemyPieces);
          break;
        case PieceName.Rook:
          pieceMoves = rookMoves(pieceCoord, myPieces, ennemyPieces);
          break;
        case PieceName.Bishop:
          pieceMoves = bishopMoves(pieceCoord, myPieces, ennemyPieces);
          break;
        case PieceName.Knight:
          pieceMoves = knightMoves(pieceCoord, myPieces);
          break;
        case PieceName.Pawn:
          pieceMoves = pawnMoves(
            pieceCoord,
            myPieces,
            ennemyPieces,
            this.game.whiteToPlay,
            this.game.passantPawn
          );
          break;
      }
      // If a piece can move
      if (pieceMoves.length > 0) {
        // Filtering out all the moves that check
        // Carefull here DO NOT POINT TO this.game.board but to a copy of it
        pieceMoves = pieceMoves.filter(
          (move) =>
            !willCheck(
              this.game.whiteToPlay,
              [...this.game.board],
              piecePos,
              move
            )
        );
        if (pieceMoves.length > 0) {
          moves[piecePos] = pieceMoves;
        }
      }
    }
    this.moves = moves;
    // Updating the game state
    const canMove = Object.keys(moves).length > 0;

    // If the player is in a stalemate position but with a check he loses
    if (!canMove && check) {
      // Example: If it's white to play, he is checked, and has no moves - Black wins, state goes to 1
      this.state = this.game.whiteToPlay ? 1 : 0;
      return;
    }
    // Game ends in stalemate if the current player has no moves
    if (!canMove) {
      this.state = 2;
      return;
    }
    // Game ends in stalemate if there was 50 halfmoves
    if (this.game.halfMoveClock > 49) {
      this.state = 2;
      return;
    }
  }
}
