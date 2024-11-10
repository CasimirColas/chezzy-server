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

interface ClassicServerGameRequest {
  // Index of the piece to move in movablePieces
  pieceToMoveIndex: number;
  // Index of the move in the corresponding Action array
  moveToPositionIndex: number;
  // If the move is a promotion indicates the requested piece
  promote: "q" | "r" | "b" | "n" | undefined;
}
interface ClassicServerGameResponse {
  // FEN notation of the new board
  board: string;
  // An array with the position of all movable pieces
  movablePieces: number[];
  // A 2d array containing all the possible legal positions for each piece in movablePieces
  // - A piece has an identical index in both arrays
  movablePieceActions: number[][];
  /**
   * Defines the current state of the game:
   * - 0: white won
   * - 1: black won
   * - 2: stalemate
   * - undefined: the game continues
   */
  state: 0 | 1 | 2 | null;
}
class ClassicGameEngine {
  private game: ClassicGameInfo;
  private state: 0 | 1 | 2 | null = null;
  private movablePieces: number[] = [];
  private movablePieceActions: number[][] = [];
  private positions: string[] = [];

  constructor(setup: ClassicGameInfo | undefined) {
    if (setup) {
      this.game = setup;
      this.positions.push(encodePosition(this.game.board));
      this.generateMoves();
    } else {
      this.game = defaultSetup;
      this.positions.push(encodePosition(this.game.board));
      this.generateMoves();
    }
  }
  info() {
    return {
      game: this.game,
      state: this.state,
      movablePieces: this.movablePieces,
      movablePieceActions: this.movablePieceActions,
    };
  }
  response(): ClassicServerGameResponse {
    return {
      state: this.state,
      board: encodeBoard(this.game),
      movablePieces: this.movablePieces,
      movablePieceActions: this.movablePieceActions,
    };
  }
  request(req: ClassicServerGameRequest) {
    const validPromotePieces = ["q", "r", "b", "n"];
    const { pieceToMoveIndex, moveToPositionIndex } = req;
    let { promote } = req;
    // Safety checks
    // pieceToMoveIndex index should exist in movablePieces
    if (pieceToMoveIndex > this.movablePieces.length || pieceToMoveIndex < 0) {
      throw new Error("Inexistant piece index");
    }
    // moveToPositionIndex index should exist in movablePieceActions for the given piece
    if (
      moveToPositionIndex > this.movablePieceActions[pieceToMoveIndex].length ||
      moveToPositionIndex < 0
    ) {
      throw new Error("Inexistant move index");
    }
    // If an unhandled promote is specified replace it by a Queen
    if (promote && !validPromotePieces.includes(promote)) {
      promote = "q";
    }

    const piece = this.game.board[pieceToMoveIndex] as ChessPiece;
    const pieceStart = this.movablePieces[pieceToMoveIndex];
    const pieceEnd =
      this.movablePieceActions[pieceToMoveIndex][moveToPositionIndex];

    switch (piece.name) {
      case PieceName.King:
        const xMouvement = getX(pieceEnd) - getX(pieceStart);
        // The king can only move 2 squares when it castles
        if (Math.abs(xMouvement) > 1) {
          // King castles King side
          if (xMouvement > 0) {
            // King move
            this.game.board[pieceEnd] = piece;
            this.game.board[pieceStart] = null;
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
            this.game.board[pieceEnd] = piece;
            this.game.board[pieceStart] = null;
            // Rook move
            if (this.game.whiteToPlay) {
              this.game.board[56] = null;
              this.game.board[59] = { name: PieceName.Rook, white: true };
            } else {
              this.game.board[0] = null;
              this.game.board[3] = { name: PieceName.Rook, white: false };
            }
          }
          // Removing the ability to castle for the player
          if (this.game.whiteToPlay) {
            this.game.canWhiteCastleKingSide = false;
            this.game.canWhiteCastleQueenSide = false;
          } else {
            this.game.canBlackCastleKingSide = false;
            this.game.canBlackCastleQueenSide = false;
          }
        } else {
          // Normal King move
          this.game.board[pieceEnd] = piece;
          this.game.board[pieceStart] = null;
          this.game.whiteToPlay = !this.game.whiteToPlay;
        }
        this.game.passantPawn = undefined;
        break;
      case PieceName.Rook:
        // For each starting rook positions, if the rook moves and it's castle is available, disable it
        // White King side
        if (pieceStart === 63 && this.game.canWhiteCastleKingSide) {
          this.game.canWhiteCastleKingSide = false;
        }
        // White Queen side
        if (pieceStart === 56 && this.game.canWhiteCastleQueenSide) {
          this.game.canWhiteCastleQueenSide = false;
        }
        // Black Queen side
        if (pieceStart === 0 && this.game.canBlackCastleQueenSide) {
          this.game.canBlackCastleQueenSide = false;
        }
        // Black King side
        if (pieceStart === 7 && this.game.canBlackCastleKingSide) {
          this.game.canBlackCastleKingSide = false;
        }
        // Normal Rook move
        this.game.passantPawn = undefined;
        this.game.board[pieceEnd] = piece;
        this.game.board[pieceStart] = null;
        this.game.whiteToPlay = !this.game.whiteToPlay;
        break;
      case PieceName.Pawn:
        const promoteLine = this.game.whiteToPlay ? 0 : 7;
        // Promote
        if (getY(pieceEnd) === promoteLine) {
          this.game.board[pieceStart] = null;
          this.game.board[pieceEnd] = {
            // If promote is defined we asume that we will get a piece from getLetterPiece()
            name: promote
              ? (getLetterPiece(promote) as PieceName)
              : PieceName.Queen,
            white: this.game.whiteToPlay,
          };
          this.game.whiteToPlay = !this.game.whiteToPlay;
          break;
        }
        // En passant move
        const pawnMoveDirection = this.game.whiteToPlay ? -1 : 1;
        if (
          this.game.passantPawn &&
          getY(pieceEnd) === getY(this.game.passantPawn) + pawnMoveDirection
        ) {
          this.game.board[this.game.passantPawn] = null;
          this.game.passantPawn = undefined;
          this.game.board[pieceEnd] = piece;
          this.game.board[pieceStart] = null;
          this.game.whiteToPlay = !this.game.whiteToPlay;
          break;
        }
        // If the pawn jumped 2 squares add him as an en passant target
        if (Math.abs(getX(pieceEnd) - getX(pieceStart))) {
          this.game.passantPawn = pieceEnd;
          this.game.board[pieceEnd] = piece;
          this.game.board[pieceStart] = null;
          this.game.whiteToPlay = !this.game.whiteToPlay;
        } else {
          // Normal Pawn move
          this.game.passantPawn = undefined;
          this.game.board[pieceEnd] = piece;
          this.game.board[pieceStart] = null;
          this.game.whiteToPlay = !this.game.whiteToPlay;
        }
        break;
      // Normal piece movement case
      default:
        this.game.passantPawn = undefined;
        this.game.board[pieceEnd] = piece;
        this.game.board[pieceStart] = null;
        this.game.whiteToPlay = !this.game.whiteToPlay;
        break;
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
    }
    // Generate moves for the next player
    this.generateMoves();
    // Records the new position
    this.positions.push(newPosition);
  }
  generateMoves() {
    let pieces = [];
    let moves = [];
    const myPieces = getPieces(this.game.board, this.game.whiteToPlay);
    const ennemyPieces = getPieces(this.game.board, !this.game.whiteToPlay);
    const danger = dangerArea(this.game.whiteToPlay, this.game.board);
    const check = danger.includes(
      this.game.board.indexOf({
        name: PieceName.King,
        white: this.game.whiteToPlay,
      })
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
      const piece = this.game.board[piecePos] as ChessPiece;
      const pieceCoord = getXY(piecePos);
      let pieceMoves: number[] = [];
      switch (piece.name) {
        case PieceName.King:
          pieceMoves = kingMoves(
            pieceCoord,
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
        pieceMoves.filter(
          (move) =>
            !willCheck(this.game.whiteToPlay, this.game.board, piecePos, move)
        );
        if (pieceMoves.length > 0) {
          pieces.push(piecePos);
          moves.push(pieceMoves);
        }
      }
    }
    this.movablePieces = pieces;
    this.movablePieceActions = moves;

    // Updating the game state

    // If the player is in a stalemate position but with a check he loses
    if (pieces.length === 0 && check) {
      // Example: If it's white to play, he is checked, and has no moves - Black wins, state goes to 1
      this.state = this.game.whiteToPlay ? 1 : 0;
      return;
    }
    // Game ends in stalemate if the current player has no moves
    if (pieces.length === 0) {
      this.state = 2;
      return;
    }
    // Game ends in stalemate if there was 50 halfmoves
    if (this.game.halfMoveClock) {
      this.state = 2;
      return;
    }
  }
}
