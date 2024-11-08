import {
  PieceName,
  type ChessBoard,
  type ClassicGameInfo,
} from "@/types/game.js";
import { PieceName as p } from "@/types/game.js";

export { defaultSetup };

const defaultSetup: ClassicGameInfo = {
  whiteToPlay: true,
  board: [
    { name: p.Rook, white: false, moves: [] },
    { name: p.Knight, white: false, moves: [] },
    { name: p.Bishop, white: false, moves: [] },
    { name: p.Queen, white: false, moves: [] },
    { name: p.King, white: false, moves: [] },
    { name: p.Bishop, white: false, moves: [] },
    { name: p.Knight, white: false, moves: [] },
    { name: p.Rook, white: false, moves: [] },
  ]
    .concat(Array(8).fill({ name: p.Pawn, white: false, moves: [] }))
    .concat(Array(32).fill(null))
    .concat(Array(8).fill({ name: p.Pawn, white: true, moves: [] }))
    .concat([
      { name: p.Rook, white: true, moves: [] },
      { name: p.Knight, white: true, moves: [] },
      { name: p.Bishop, white: true, moves: [] },
      { name: p.Queen, white: true, moves: [] },
      { name: p.King, white: true, moves: [] },
      { name: p.Bishop, white: true, moves: [] },
      { name: p.Knight, white: true, moves: [] },
      { name: p.Rook, white: true, moves: [] },
    ]),
  events: {
    whiteCastleQueenSide: false,
    whiteCastleKingSide: false,
    blackCastleQueenSide: false,
    blackCastleKingSide: false,
    jumpPawn: undefined,
  },
};

type Coord = {
  x: number;
  y: number;
};

function getPieceLetter(piece: PieceName) {
  switch (piece) {
    case PieceName.King:
      return "k";
    case PieceName.Queen:
      return "q";
    case PieceName.Rook:
      return "r";
    case PieceName.Bishop:
      return "b";
    case PieceName.Knight:
      return "n";
    case PieceName.Pawn:
      return "p";
  }
}
function getLetterPiece(letter: string) {
  if (letter.length > 1) {
    throw new Error("This is not a letter");
  }
  switch (letter) {
    case "k":
      return PieceName.King;
    case "q":
      return PieceName.Queen;
    case "r":
      return PieceName.Rook;
    case "b":
      return PieceName.Bishop;
    case "n":
      return PieceName.Knight;
    case "p":
      return PieceName.Pawn;
  }
}
function getChessMove(pos: number) {
  const letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const coord = getXY(pos);
  return letters[coord.x] + (coord.y + 1);
}
function fromChessMoveToPos(move: string) {
  if (move.length > 2) {
    throw new Error("Incorrect move format (more than 2 chars)");
  }
  const letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const x = letters.indexOf(move.charAt(0));
  const y = parseInt(move.charAt(1)) - 1;
  if (x === -1) {
    throw new Error("Incorrect letter position");
  }
  if (y < 0 || y > 7) {
    throw new Error("Y position is out of bounds");
  }
  return getPlace({ x, y });
}
function getPieces(board: ChessBoard, white: boolean) {
  let pieces = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i]?.white === white) {
      pieces.push(i);
    }
  }
  return pieces;
}
function getX(pos: number) {
  return pos % 8;
}
function getY(pos: number) {
  return (pos - (pos % 8)) / 8;
}
function getXY(pos: number) {
  return { x: pos % 8, y: (pos - (pos % 8)) / 8 };
}
function getPlace(coord: Coord) {
  return coord.y * 8 + coord.x;
}
function getPlaces(coords: Coord[]) {
  return coords.map((e) => e.y * 8 + e.x);
}
function boundCoords(coords: Coord[]) {
  return coords.filter((e) => e.x >= 0 && e.x <= 7 && e.y >= 0 && e.y <= 7);
}
function boundPlaces(coords: Coord[]) {
  return getPlaces(boundCoords(coords));
}
function noTeamKill(boundPlaces: number[], allies: number[]) {
  return boundPlaces.filter((e) => !allies.includes(e));
}
function knightMoves(coord: Coord, allies: number[]): number[] {
  return noTeamKill(
    boundPlaces([
      { x: coord.x - 1, y: coord.y - 2 },
      { x: coord.x + 1, y: coord.y - 2 },
      { x: coord.x - 2, y: coord.y - 1 },
      { x: coord.x + 2, y: coord.y - 1 },
      { x: coord.x - 2, y: coord.y + 1 },
      { x: coord.x + 2, y: coord.y + 1 },
      { x: coord.x - 1, y: coord.y + 2 },
      { x: coord.x + 1, y: coord.y + 2 },
    ]),
    allies
  );
}
function bishopMoves(
  coord: Coord,
  allies: number[],
  ennemies: number[]
): number[] {
  let bishopMoves = [];
  // For each of the 4 diagonals represented by stages from 0 to 3
  for (let i = 0; i < 4; i++) {
    // Set coordinates to the origin of the piece
    let checkedCoord = coord;
    // Determines wich diagonal path will be checked
    function stageProgress(stage: number) {
      switch (stage) {
        case 0:
          checkedCoord.x++;
          checkedCoord.y++;
          break;
        case 1:
          checkedCoord.x--;
          checkedCoord.y--;
          break;
        case 2:
          checkedCoord.x--;
          checkedCoord.y++;
          break;
        case 3:
          checkedCoord.x++;
          checkedCoord.y--;
          break;
      }
    }
    for (let j = 0; j < 8; j++) {
      stageProgress(i);
      // Exit if the coordinates are out of the board
      if (
        checkedCoord.x > 8 &&
        checkedCoord.x <= 0 &&
        checkedCoord.y > 8 &&
        checkedCoord.y <= 0
      ) {
        break;
      }
      // If the current square is an ennemy piece we add it to the available moves and exit the loop
      if (ennemies.includes(getPlace(checkedCoord))) {
        bishopMoves.push(getPlace(checkedCoord));
        break;
      }
      // Exit the loop if the current square is an allied piece
      if (allies.includes(getPlace(checkedCoord))) {
        break;
      }
      // Add the legal move to the array
      bishopMoves.push(getPlace(checkedCoord));
    }
  }
  return bishopMoves;
}
function rookMoves(
  coord: Coord,
  allies: number[],
  ennemies: number[]
): number[] {
  let rookMoves = [];
  for (let i = 0; i < 4; i++) {
    // Set coordinates to the origin of the piece
    let checkedCoord = coord;
    // Determines wich path will be checked
    function stageProgress(stage: number) {
      switch (stage) {
        case 0:
          checkedCoord.x++;
          break;
        case 1:
          checkedCoord.y++;
          break;
        case 0:
          checkedCoord.x--;
          break;
        case 1:
          checkedCoord.y--;
          break;
      }
    }
    for (let j = 0; j < 8; j++) {
      stageProgress(i);
      // Exit if the coordinates are out of the board
      if (
        checkedCoord.x > 8 &&
        checkedCoord.x <= 0 &&
        checkedCoord.y > 8 &&
        checkedCoord.y <= 0
      ) {
        break;
      }
      // If the current square is an ennemy piece we add it to the available moves and exit the loop
      if (ennemies.includes(getPlace(checkedCoord))) {
        rookMoves.push(getPlace(checkedCoord));
        break;
      }
      // Exit the loop if the current square is an allied piece
      if (allies.includes(getPlace(checkedCoord))) {
        break;
      }
      // Add the legal move to the array
      rookMoves.push(getPlace(checkedCoord));
    }
  }
  return rookMoves;
}
function queenMoves(
  coord: Coord,
  allies: number[],
  ennemies: number[]
): number[] {
  return bishopMoves(coord, allies, ennemies).concat(
    rookMoves(coord, allies, ennemies)
  );
}
function pawnMoves(
  coord: Coord,
  allies: number[],
  ennemies: number[],
  white: boolean,
  jumpPawn: number | null
): number[] {
  let pawnMoves = [];
  const pieces = allies.concat(ennemies);
  const direction = white ? -1 : 1;
  const jumpLine = white ? 6 : 1;
  // Can the pawn move forward
  if (!pieces.includes(getPlace({ x: coord.x + direction, y: coord.y }))) {
    pawnMoves.push(getPlace({ x: coord.x + direction, y: coord.y }));
    // Can he jump
    if (
      coord.y === jumpLine &&
      !pieces.includes(getPlace({ x: coord.x + direction * 2, y: coord.y }))
    ) {
      pawnMoves.push(getPlace({ x: coord.x + direction * 2, y: coord.y }));
    }
  }
  // Can the pawn eat
  for (let i = 0; i < ennemies.length; i++) {
    const ennemyCoord = getXY(ennemies[i]);
    // Checking if the ennemy piece is in front of the pawn y wise and that it is positionned diagonally
    if (
      coord.y + direction === ennemyCoord.y &&
      (ennemyCoord.x === coord.x + 1 || ennemyCoord.x === coord.x - 1)
    ) {
      pawnMoves.push(ennemies[i]);
    }
  }
  // Can the pawn en passant
  if (
    jumpPawn &&
    (getX(jumpPawn) + 1 === coord.x || getX(jumpPawn) - 1 === coord.x)
  ) {
    pawnMoves.push(getPlace({ x: getX(jumpPawn), y: coord.y + direction }));
  }
  return pawnMoves;
}
function kingMoves(
  coord: Coord,
  allies: number[],
  canCastleQueenSide: boolean,
  canCastleKingSide: boolean,
  danger: number[]
): number[] {
  const moves = [
    { x: coord.x, y: coord.y + 1 },
    { x: coord.x, y: coord.y - 1 },
    { x: coord.x + 1, y: coord.y },
    { x: coord.x - 1, y: coord.y },
    { x: coord.x + 1, y: coord.y + 1 },
    { x: coord.x - 1, y: coord.y - 1 },
    { x: coord.x + 1, y: coord.y - 1 },
    { x: coord.x - 1, y: coord.y + 1 },
  ];
  // Purging king moves from illigal moves
  let kingMoves = noTeamKill(boundPlaces(moves), allies).filter(
    (square) => !danger.includes(square)
  );
  // Adding the castles squares if the king can castle
  if (canCastleKingSide) {
    kingMoves.push(getPlace({ x: coord.x + 2, y: coord.y }));
  }
  if (canCastleQueenSide) {
    kingMoves.push(getPlace({ x: coord.x - 2, y: coord.y }));
  }
  return kingMoves;
}
// This function determines where the king cannot go
function dangerArea(white: boolean, board: ChessBoard): number[] {
  let dangerArea: number[] = [];
  // Getting the list of all ennemy pieces that can be a threat
  const ennemyPieces = board
    .map((place, i) => {
      if (place !== null && place.white !== white) {
        return { name: place.name, pos: i };
      } else return null;
    })
    .filter((place) => place != null);

  // Ennemies and Allies are concidered depending on the passed white boolean
  const ennemies = white ? getPieces(board, false) : getPieces(board, true);
  const allies = white ? getPieces(board, true) : getPieces(board, false);
  // Loop through every ennemy piece and save every square they attack
  for (let i = 0; i < ennemyPieces.length; i++) {
    const piece = ennemyPieces[i];
    switch (piece.name) {
      case PieceName.Rook:
        dangerArea.concat(rookMoves(getXY(piece.pos), ennemies, allies));
        break;
      case PieceName.Bishop:
        dangerArea.concat(bishopMoves(getXY(piece.pos), ennemies, allies));
        break;
      case PieceName.Knight:
        dangerArea.concat(knightMoves(getXY(piece.pos), ennemies));
        break;
      case PieceName.Queen:
        dangerArea.concat(queenMoves(getXY(piece.pos), ennemies, allies));
        break;
      case PieceName.King:
        const kingCoords = getXY(piece.pos);
        dangerArea.concat(
          boundPlaces([
            { x: kingCoords.x, y: kingCoords.y + 1 },
            { x: kingCoords.x, y: kingCoords.y - 1 },
            { x: kingCoords.x + 1, y: kingCoords.y },
            { x: kingCoords.x - 1, y: kingCoords.y },
            { x: kingCoords.x + 1, y: kingCoords.y + 1 },
            { x: kingCoords.x - 1, y: kingCoords.y - 1 },
            { x: kingCoords.x + 1, y: kingCoords.y - 1 },
            { x: kingCoords.x - 1, y: kingCoords.y + 1 },
          ])
        );
        break;
      case PieceName.Pawn:
        const pawnCoords = getXY(piece.pos);
        const pawnDanger = white
          ? boundPlaces([
              { x: pawnCoords.x + 1, y: pawnCoords.y + 1 },
              { x: pawnCoords.x - 1, y: pawnCoords.y + 1 },
            ])
          : boundPlaces([
              { x: pawnCoords.x + 1, y: pawnCoords.y - 1 },
              { x: pawnCoords.x - 1, y: pawnCoords.y - 1 },
            ]);
        dangerArea.concat(pawnDanger);
        break;
    }
  }
  // Removing duplicates from the danger array
  return Array.from(new Set(dangerArea));
}
// This function determines weather a move puts the king in check
function willCheck(
  white: boolean,
  board: ChessBoard,
  pieceStart: number,
  pieceEnd: number
): boolean {
  let game = board;
  game[pieceEnd] = game[pieceStart];
  game[pieceStart] = null;
  const kingPos = board.indexOf({ name: PieceName.King, white: white });
  // In the unlikely event that there is no king on the board
  if (kingPos === -1) {
    return false;
  }
  const danger = dangerArea(white, game);
  return danger.includes(kingPos);
}
/**
 * Converts a boad into a simplified string
 *
 * The rules are taken from the lichess.org board editor and are as follows:
 *
 * - black pieces will be lower case letters r,n,b,q,k
 * - white pieces will be upper case letters R,N,B,Q,K
 * - consecutive empty spaces are represented by a number
 * - every end of line is separated by /
 * - after the board data use a white space
 * - color to play w or b
 * - white space
 * - available castle options for white Q and K
 * - available castle options for black q and k
 * - white space
 * - en passant position in standart chess notation
 */
function encodeBoard(game: ClassicGameInfo): string {
  const board = game.board;
  let code = "";
  let consecutiveEmpty = 0;
  for (let i = 0; i < board.length; i++) {
    const square = board[i];
    // If there is a pice on the square
    if (square !== null) {
      // If there were empty squares before the piece
      if (consecutiveEmpty > 0) {
        code += consecutiveEmpty;
        consecutiveEmpty = 0;
      }
      // Adds the piece
      const piece = getPieceLetter(square.name);
      code += square.white ? piece.toUpperCase() : piece;
    } else {
      // If the current square is empty update the counter
      consecutiveEmpty++;
    }
    // Every end of line
    if (i % 8 === 0) {
      if (consecutiveEmpty > 0) {
        code += consecutiveEmpty;
        consecutiveEmpty = 0;
      }
      code += "/";
    }
  }
  code += " ";
  code += game.whiteToPlay ? "w" : "b";
  if (game.events.whiteCastleKingSide) code += "K";
  if (game.events.whiteCastleQueenSide) code += "Q";
  if (game.events.blackCastleKingSide) code += "k";
  if (game.events.blackCastleQueenSide) code += "q";
  code += " ";
  if (game.events.jumpPawn) code += getChessMove(game.events.jumpPawn);
  return code;
}
// Converts a string into a game state see the rules on converstion
function decodeBoard(code: string): ClassicGameInfo {
  const decode = code.split(" ");
  // NOTE: Include safey checks here to make sure the decode string is properly fromated
  let game: ClassicGameInfo = {
    whiteToPlay: decode[1] === "w",
    board: Array(64).fill(null),
    events: {
      whiteCastleQueenSide: decode[3].includes("Q"),
      whiteCastleKingSide: decode[3].includes("K"),
      blackCastleQueenSide: decode[3].includes("q"),
      blackCastleKingSide: decode[3].includes("k"),
      jumpPawn: fromChessMoveToPos(decode[4]),
    },
  };
  const gamecode = decode[0].replaceAll("/", "");
  // The head represents the position of the board we are filling
  let head = 0;
  for (let i = 0; i < gamecode.length; i++) {
    const char = gamecode[i];
    // If the char is a letter
    if (isNaN(parseInt(char))) {
      const piece = getLetterPiece(char);
      if (piece) {
        // Put the piece on the head
        game.board[head] = { name: piece, white: char === char.toUpperCase() };
        // Move the head to the next square
        head++;
      } else {
        throw new Error(
          "Somehow not matching piece where found but conversion happened"
        );
      }
    } else {
      // If the char is a number move the head to the next piece position
      head += parseInt(char);
    }
    // Safeguard, when the head is above 63 it means we filled the board
    if (head > 63) {
      break;
    }
  }
  return game;
}
