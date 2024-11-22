import {
  PieceName,
  type ChessBoard,
  type ClassicGameInfo,
} from "@/types/game.js";

export { defaultSetup };

const defaultSetup: ClassicGameInfo = {
  whiteToPlay: true,
  board: [
    { name: PieceName.Rook, white: false },
    { name: PieceName.Knight, white: false },
    { name: PieceName.Bishop, white: false },
    { name: PieceName.Queen, white: false },
    { name: PieceName.King, white: false },
    { name: PieceName.Bishop, white: false },
    { name: PieceName.Knight, white: false },
    { name: PieceName.Rook, white: false },
  ]
    .concat(Array(8).fill({ name: PieceName.Pawn, white: false }))
    .concat(Array(32).fill(null))
    .concat(Array(8).fill({ name: PieceName.Pawn, white: true }))
    .concat([
      { name: PieceName.Rook, white: true },
      { name: PieceName.Knight, white: true },
      { name: PieceName.Bishop, white: true },
      { name: PieceName.Queen, white: true },
      { name: PieceName.King, white: true },
      { name: PieceName.Bishop, white: true },
      { name: PieceName.Knight, white: true },
      { name: PieceName.Rook, white: true },
    ]),
  canWhiteCastleQueenSide: true,
  canWhiteCastleKingSide: true,
  canBlackCastleQueenSide: true,
  canBlackCastleKingSide: true,
  passantPawn: undefined,
  halfMoveClock: 0,
  fullMoves: 1,
};

type Coord = {
  x: number;
  y: number;
};

export function getPieceLetter(piece: PieceName) {
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
export function getLetterPiece(letter: string) {
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
    default:
      throw new Error("This letter is not a chess piece");
  }
}
export function getChessMove(pos: number) {
  if (pos < 0 || pos > 63) {
    throw new Error("This is not a square on the chess board");
  }
  const letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const numbers = [8, 7, 6, 5, 4, 3, 2, 1];
  const coord = getXY(pos);
  return letters[coord.x] + numbers[coord.y];
}
export function fromChessMoveToPos(move: string) {
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
export function getPieces(board: ChessBoard, white: boolean) {
  let pieces = [];
  for (let i = 0; i < board.length; i++) {
    const piece = board[i];
    if (piece !== null && piece.white === white) {
      pieces.push(i);
    }
  }
  return pieces;
}
export function getX(pos: number) {
  return pos % 8;
}
export function getY(pos: number) {
  return (pos - (pos % 8)) / 8;
}
export function getXY(pos: number) {
  return { x: pos % 8, y: (pos - (pos % 8)) / 8 };
}
export function getPlace(coord: Coord) {
  return coord.y * 8 + coord.x;
}
export function getPlaces(coords: Coord[]) {
  return coords.map((e) => e.y * 8 + e.x);
}
export function boundCoords(coords: Coord[]) {
  return coords.filter((e) => e.x >= 0 && e.x <= 7 && e.y >= 0 && e.y <= 7);
}
export function boundPlaces(coords: Coord[]) {
  return getPlaces(boundCoords(coords));
}
export function noTeamKill(boundPlaces: number[], allies: number[]) {
  return boundPlaces.filter((e) => !allies.includes(e));
}
export function knightMoves(coord: Coord, allies: number[]): number[] {
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
export function bishopMoves(
  coord: Coord,
  allies: number[],
  ennemies: number[]
): number[] {
  let bishopMoves = [];
  // For each of the 4 diagonals represented by stages from 0 to 3
  for (let i = 0; i < 4; i++) {
    // Set coordinates to the origin of the piece
    let checkedCoord = { ...coord };
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
        checkedCoord.x > 7 ||
        checkedCoord.x < 0 ||
        checkedCoord.y > 7 ||
        checkedCoord.y < 0
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
export function rookMoves(
  coord: Coord,
  allies: number[],
  ennemies: number[]
): number[] {
  let rookMoves = [];
  for (let i = 0; i < 4; i++) {
    // Set coordinates to the origin of the piece
    let checkedCoord = { ...coord };
    // Determines wich path will be checked
    function stageProgress(stage: number) {
      switch (stage) {
        case 0:
          checkedCoord.x++;
          break;
        case 1:
          checkedCoord.y++;
          break;
        case 2:
          checkedCoord.x--;
          break;
        case 3:
          checkedCoord.y--;
          break;
      }
    }
    for (let j = 0; j < 8; j++) {
      stageProgress(i);
      // Exit if the coordinates are out of the board
      if (
        checkedCoord.x > 7 ||
        checkedCoord.x < 0 ||
        checkedCoord.y > 7 ||
        checkedCoord.y < 0
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
export function queenMoves(
  coord: Coord,
  allies: number[],
  ennemies: number[]
): number[] {
  return bishopMoves(coord, allies, ennemies).concat(
    rookMoves(coord, allies, ennemies)
  );
}
export function pawnMoves(
  coord: Coord,
  allies: number[],
  ennemies: number[],
  white: boolean,
  passantPawn: number | undefined
): number[] {
  let pawnMoves = [];
  const pieces = allies.concat(ennemies);
  const direction = white ? -1 : 1;
  const jumpLine = white ? 6 : 1;
  // Can the pawn move forward
  if (!pieces.includes(getPlace({ x: coord.x, y: coord.y + direction }))) {
    pawnMoves.push(getPlace({ x: coord.x, y: coord.y + direction }));
    // Can he jump
    if (
      coord.y === jumpLine &&
      !pieces.includes(getPlace({ x: coord.x, y: coord.y + direction * 2 }))
    ) {
      pawnMoves.push(getPlace({ x: coord.x, y: coord.y + direction * 2 }));
    }
  }
  // Can the pawn eat right
  if (ennemies.includes(getPlace({ x: coord.x + 1, y: coord.y + direction }))) {
    pawnMoves.push(getPlace({ x: coord.x + 1, y: coord.y + direction }));
  }
  // Can the pawn eat left
  if (ennemies.includes(getPlace({ x: coord.x - 1, y: coord.y + direction }))) {
    pawnMoves.push(getPlace({ x: coord.x - 1, y: coord.y + direction }));
  }
  // Can the pawn en passant
  if (
    passantPawn &&
    (getX(passantPawn) + 1 === coord.x || getX(passantPawn) - 1 === coord.x)
  ) {
    pawnMoves.push(getPlace({ x: getX(passantPawn), y: coord.y + direction }));
  }
  return pawnMoves;
}
export function kingMoves(
  coord: Coord,
  white: boolean,
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
  const queenSideSquares = white ? [57, 59, 59] : [1, 2, 3];
  const kingSideSquares = white ? [61, 62] : [5, 6];
  // Purging king moves from illigal moves
  let kingMoves = noTeamKill(boundPlaces(moves), allies).filter(
    (square) => !danger.includes(square)
  );
  // Adding the castles squares if the king can castle
  if (
    canCastleKingSide &&
    !danger.some((e) => kingSideSquares.includes(e)) &&
    !allies.some((e) => kingSideSquares.includes(e))
  ) {
    kingMoves.push(getPlace({ x: coord.x + 2, y: coord.y }));
  }
  if (
    canCastleQueenSide &&
    !danger.some((e) => queenSideSquares.includes(e)) &&
    !allies.some((e) => queenSideSquares.includes(e))
  ) {
    kingMoves.push(getPlace({ x: coord.x - 2, y: coord.y }));
  }
  return kingMoves;
}
// This function determines where the king cannot go
export function dangerArea(white: boolean, board: ChessBoard): number[] {
  let dangerArea: number[] = [];
  // Getting the list of all ennemy pieces that can be a threat
  const ennemyPieces = board
    .map((place, i) => {
      if (place !== null && place.white !== white) {
        return { name: place.name, pos: i };
      } else return null;
    })
    .filter((place) => place != null);
  // To include all the guarded pieces for this special case, "ennemies" will be all pieces on board
  const all = board
    .map((place, i) => (place !== null ? i : null))
    .filter((e) => e !== null);
  // Loop through every ennemy piece and save every square they attack
  for (let i = 0; i < ennemyPieces.length; i++) {
    const piece = ennemyPieces[i];
    switch (piece.name) {
      case PieceName.Rook:
        dangerArea = dangerArea.concat(rookMoves(getXY(piece.pos), [], all));
        break;
      case PieceName.Bishop:
        dangerArea = dangerArea.concat(bishopMoves(getXY(piece.pos), [], all));
        break;
      case PieceName.Knight:
        dangerArea = dangerArea.concat(knightMoves(getXY(piece.pos), []));
        break;
      case PieceName.Queen:
        dangerArea = dangerArea.concat(queenMoves(getXY(piece.pos), [], all));
        break;
      case PieceName.King:
        const kingCoords = getXY(piece.pos);
        dangerArea = dangerArea.concat(
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
        dangerArea = dangerArea.concat(pawnDanger);
        break;
    }
  }
  // Removing duplicates from the danger array
  return Array.from(new Set(dangerArea));
}
// This function determines weather a move puts your king in check, used to determine if a move is illigal
export function willCheck(
  white: boolean,
  board: ChessBoard,
  pieceStart: number,
  pieceEnd: number
): boolean {
  let game = board;
  game[pieceEnd] = game[pieceStart];
  game[pieceStart] = null;
  function findKing(boad: ChessBoard, white: boolean): number {
    for (let i = 0; i < boad.length; i++) {
      const piece = boad[i];
      if (
        piece !== null &&
        piece.name === PieceName.King &&
        piece.white === white
      ) {
        return i;
      }
    }
    return -1;
  }
  const kingPos = findKing(game, white);
  // In the unlikely event that there is no king on the board
  if (kingPos === -1) {
    return false;
  }
  const danger = dangerArea(white, game);
  return danger.includes(kingPos);
}
/**
 * Converts a boad into a simplified string using FEN notation,
 * Read more about it here: https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
 */
export function encodePosition(board: ChessBoard): string {
  let code = "";
  let consecutiveEmpty = 0;
  for (let i = 0; i < board.length; i++) {
    const square = board[i];
    // If there is a piece on the square
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
    if ((i + 1) % 8 === 0 && i !== 63) {
      if (consecutiveEmpty > 0) {
        code += consecutiveEmpty;
        consecutiveEmpty = 0;
      }
      code += "/";
    }
  }
  if (consecutiveEmpty > 0) {
    code += consecutiveEmpty;
  }
  return code;
}
export function encodeBoard(game: ClassicGameInfo): string {
  const board = game.board;
  let code = encodePosition(board);
  code += " ";
  code += game.whiteToPlay ? "w" : "b";
  code += " ";
  if (game.canWhiteCastleKingSide) code += "K";
  if (game.canWhiteCastleQueenSide) code += "Q";
  if (game.canBlackCastleKingSide) code += "k";
  if (game.canBlackCastleQueenSide) code += "q";
  if (
    !game.canWhiteCastleKingSide &&
    !game.canWhiteCastleQueenSide &&
    !game.canBlackCastleKingSide &&
    !game.canBlackCastleQueenSide
  ) {
    code += "-";
  }
  code += " ";
  code += game.passantPawn ? getChessMove(game.passantPawn) : "-";
  code += " ";
  code += game.halfMoveClock;
  code += " ";
  code += game.fullMoves;
  return code;
}
/**
 * Converts a FEN string into a game state see the rules on converstion
 * Read more about FEN here: https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
 */
export function decodeBoard(code: string): ClassicGameInfo {
  const decode = code.split(" ");
  // NOTE: Include safey checks here to make sure the decode string is properly fromated
  let game: ClassicGameInfo = {
    whiteToPlay: decode[1] === "w",
    board: Array(64).fill(null),
    canWhiteCastleQueenSide: decode[2].includes("Q"),
    canWhiteCastleKingSide: decode[2].includes("K"),
    canBlackCastleQueenSide: decode[2].includes("q"),
    canBlackCastleKingSide: decode[2].includes("k"),
    passantPawn:
      decode[3].charAt(0) === "-" ? undefined : fromChessMoveToPos(decode[3]),
    halfMoveClock: parseInt(decode[4]),
    fullMoves: parseInt(decode[5]),
  };
  const gamecode = decode[0].replaceAll("/", "").split("");
  // The head represents the position of the board we are filling
  let head = 0;
  for (let i = 0; i < gamecode.length; i++) {
    const char = gamecode[i];
    // If the char is a letter
    if (isNaN(parseInt(char))) {
      const piece = getLetterPiece(char.toLowerCase());
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
