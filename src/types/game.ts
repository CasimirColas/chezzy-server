interface Player {}

enum PieceName {
  King = "king",
  Queen = "queen",
  Rook = "rook",
  Bishop = "bishop",
  Knight = "knight",
  Pawn = "pawn",
}

type King = { name: PieceName.King; white: boolean };
type Queen = { name: PieceName.Queen; white: boolean };
type Rook = { name: PieceName.Rook; white: boolean };
type Bishop = { name: PieceName.Bishop; white: boolean };
type Knight = { name: PieceName.Knight; white: boolean };
type Pawn = { name: PieceName.Pawn; white: boolean };

type ChessPiece = King | Queen | Rook | Bishop | Knight | Pawn;

type ChessBoard = (ChessPiece | null)[];

type ClassicGameInfo = {
  whiteToPlay: boolean;
  board: ChessBoard;
  events: {
    canWhiteCastleQueenSide: boolean;
    canWhiteCastleKingSide: boolean;
    canBlackCastleQueenSide: boolean;
    canBlackCastleKingSide: boolean;
    jumpPawn: number | undefined;
  };
};

export type { ClassicGameInfo, ChessBoard };
export { PieceName };
