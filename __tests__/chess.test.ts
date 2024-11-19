import * as c from "@/chess/chess.js";
import { describe, expect, test } from "vitest";
import {
  PieceName,
  type ChessBoard,
  type ClassicGameInfo,
} from "@/types/game.js";

const testingBoard: ChessBoard = [
  null,
  null,
  { name: PieceName.Bishop, white: false },
  null,
  null,
  null,
  null,
  null,
  { name: PieceName.Pawn, white: false },
  null,
  null,
  { name: PieceName.Knight, white: true },
  { name: PieceName.Bishop, white: true },
  { name: PieceName.Pawn, white: false },
  null,
  { name: PieceName.Pawn, white: false },
  null,
  { name: PieceName.Bishop, white: false },
  { name: PieceName.Pawn, white: false },
  null,
  { name: PieceName.Knight, white: false },
  { name: PieceName.Pawn, white: true },
  { name: PieceName.Pawn, white: true },
  { name: PieceName.Rook, white: false },
  null,
  null,
  null,
  { name: PieceName.Pawn, white: true },
  null,
  null,
  null,
  null,
  null,
  null,
  { name: PieceName.Pawn, white: false },
  { name: PieceName.Rook, white: true },
  { name: PieceName.Knight, white: false },
  { name: PieceName.Rook, white: false },
  null,
  { name: PieceName.Pawn, white: true },
  null,
  { name: PieceName.King, white: false },
  null,
  { name: PieceName.Bishop, white: true },
  null,
  { name: PieceName.Pawn, white: true },
  { name: PieceName.Pawn, white: false },
  { name: PieceName.Pawn, white: false },
  null,
  { name: PieceName.Pawn, white: true },
  null,
  { name: PieceName.Pawn, white: true },
  null,
  { name: PieceName.Pawn, white: false },
  { name: PieceName.Queen, white: true },
  { name: PieceName.Pawn, white: true },
  { name: PieceName.Rook, white: true },
  { name: PieceName.Queen, white: false },
  null,
  { name: PieceName.Knight, white: true },
  null,
  null,
  null,
  { name: PieceName.King, white: true },
];
const itsFen =
  "2b5/p2NBp1p/1bp1nPPr/3P4/2pRnr1P/1k1B1Ppp/1P1P1pQP/Rq1N3K b - - 0 1";

describe("Chess Utility Functions", () => {
  describe("FEN Encoding and Decoding", () => {
    test("encodePosition should convert board to FEN notation", () => {
      const board: ChessBoard = [...testingBoard];
      const fen = c.encodePosition(board);
      expect(fen).toEqual(itsFen.split(" ")[0]);
    });

    test("encodeBoard should generate full FEN string", () => {
      const game: ClassicGameInfo = {
        board: [...testingBoard],
        whiteToPlay: false,
        canWhiteCastleKingSide: false,
        canWhiteCastleQueenSide: false,
        canBlackCastleKingSide: false,
        canBlackCastleQueenSide: false,
        halfMoveClock: 0,
        fullMoves: 1,
        passantPawn: undefined,
      };
      const fen = c.encodeBoard(game);
      expect(fen).toEqual(itsFen);
    });

    describe("decodeBoard should create game state from FEN", () => {
      test("should create the starting position", () => {
        const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        const game = c.decodeBoard(fen);
        expect(JSON.stringify(game.board)).toEqual(
          JSON.stringify(c.defaultSetup.board)
        );
        expect(game.whiteToPlay).toBe(true);
        expect(game.canWhiteCastleKingSide).toBe(true);
      });
      test("should recreate the testing position", () => {
        const game = c.decodeBoard(itsFen);
        expect(JSON.stringify(game.board)).toEqual(
          JSON.stringify([...testingBoard])
        );
        expect(game.whiteToPlay).toBe(false);
        expect(game.canWhiteCastleKingSide).toBe(false);
        expect(game.passantPawn).toBe(undefined);
      });
    });
  });

  describe("getPieceLetter", () => {
    test("should return correct lowercase letter for each piece", () => {
      expect(c.getPieceLetter(PieceName.King)).toBe("k");
      expect(c.getPieceLetter(PieceName.Queen)).toBe("q");
      expect(c.getPieceLetter(PieceName.Rook)).toBe("r");
      expect(c.getPieceLetter(PieceName.Bishop)).toBe("b");
      expect(c.getPieceLetter(PieceName.Knight)).toBe("n");
      expect(c.getPieceLetter(PieceName.Pawn)).toBe("p");
    });
  });

  describe("getLetterPiece", () => {
    test("should return correct PieceName for each letter", () => {
      expect(c.getLetterPiece("k")).toBe(PieceName.King);
      expect(c.getLetterPiece("q")).toBe(PieceName.Queen);
      expect(c.getLetterPiece("r")).toBe(PieceName.Rook);
      expect(c.getLetterPiece("b")).toBe(PieceName.Bishop);
      expect(c.getLetterPiece("n")).toBe(PieceName.Knight);
      expect(c.getLetterPiece("p")).toBe(PieceName.Pawn);
    });
    test("should throw error for invalid size string", () => {
      expect(() => c.getLetterPiece("z135ad")).toThrowError(
        "This is not a letter"
      );
    });
    test("should throw error for invalid letter", () => {
      expect(() => c.getLetterPiece("z")).toThrowError(
        "This letter is not a chess piece"
      );
    });
  });

  describe("getChessMove", () => {
    test("should return chess notation for board position", () => {
      expect(c.getChessMove(56)).toBe("a1");
      expect(c.getChessMove(7)).toBe("h8");
      expect(c.getChessMove(0)).toBe("a8");
      expect(c.getChessMove(27)).toBe("d5");
      expect(c.getChessMove(63)).toBe("h1");
    });
    test("should throw error for a square above 63", () => {
      expect(() => c.getChessMove(77)).toThrowError(
        "This is not a square on the chess board"
      );
    });
    test("should throw error for a square below 0", () => {
      expect(() => c.getChessMove(-3)).toThrowError(
        "This is not a square on the chess board"
      );
    });
  });

  describe("fromChessMoveToPos", () => {
    test("should return board position from chess notation", () => {
      expect(c.fromChessMoveToPos("a1")).toBe(0);
      expect(c.fromChessMoveToPos("h8")).toBe(63);
    });
    test("should throw error for invalid notation", () => {
      expect(() => c.fromChessMoveToPos("a9")).toThrowError(
        "Y position is out of bounds"
      );
      expect(() => c.fromChessMoveToPos("z1")).toThrowError(
        "Incorrect letter position"
      );
    });
  });

  describe("getPieces", () => {
    test("should return positions of pieces for given color", () => {
      const board: ChessBoard = c.defaultSetup.board;
      const blackPieces = c.getPieces(board, false).sort();
      const whitePieces = c.getPieces(board, true).sort();
      expect(blackPieces).toEqual(
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].sort()
      );
      expect(whitePieces).toEqual(
        [63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 49, 48].sort()
      );
    });
  });

  describe("Coordinate Helpers", () => {
    test("getX should return correct X position", () => {
      expect(c.getX(0)).toBe(0);
      expect(c.getX(15)).toBe(7);
    });
    test("getY should return correct Y position", () => {
      expect(c.getY(0)).toBe(0);
      expect(c.getY(63)).toBe(7);
    });
    test("getXY should return correct coordinates", () => {
      expect(c.getXY(0)).toEqual({ x: 0, y: 0 });
      expect(c.getXY(63)).toEqual({ x: 7, y: 7 });
    });
    test("getPlace should return correct board index for coordinates", () => {
      expect(c.getPlace({ x: 0, y: 0 })).toBe(0);
      expect(c.getPlace({ x: 7, y: 7 })).toBe(63);
    });
  });

  describe("boundCoords and boundPlaces", () => {
    test("should filter out-of-bound coordinates", () => {
      const coords = [
        { x: -1, y: 0 },
        { x: 3, y: 3 },
        { x: 7, y: 7 },
        { x: 8, y: 5 },
      ];
      expect(c.boundCoords(coords)).toEqual([
        { x: 3, y: 3 },
        { x: 7, y: 7 },
      ]);
    });
  });

  describe("noTeamKill", () => {
    test("should remove allied positions from move set", () => {
      expect(c.noTeamKill([0, 1, 2, 3], [1, 3])).toEqual([0, 2]);
    });
  });

  describe("Piece Move Functions", () => {
    test("knightMoves should return correct moves", () => {
      const knightPos = { x: 1, y: 2 };
      const allies = [11];
      expect(c.knightMoves(knightPos, allies).sort()).toEqual(
        [0, 2, 27, 32, 34].sort()
      );
    });

    test("bishopMoves should return diagonal moves avoiding team kill and capturing enemies", () => {
      const bishopPos = { x: 5, y: 4 };
      const allies = [19];
      const enemies = [51];
      const bishopMoves = c.bishopMoves(bishopPos, allies, enemies).sort();
      expect(bishopMoves).toEqual([28, 30, 23, 44, 51, 46, 55].sort());
    });

    test("rookMoves should return straight moves avoiding team kill and capturing enemies", () => {
      const rookPos = { x: 3, y: 4 };
      const allies = [38];
      const enemies = [11];
      expect(c.rookMoves(rookPos, allies, enemies).sort()).toEqual(
        [11, 19, 27, 32, 33, 34, 36, 37, 43, 51, 59].sort()
      );
    });

    test("queenMoves should return combined rook and bishop moves", () => {
      const queenPos = { x: 3, y: 4 };
      const allies = [38, 44];
      const enemies = [11, 49];
      const queenMoves = c.queenMoves(queenPos, allies, enemies).sort();
      expect(queenMoves).toEqual(
        [
          8, 17, 26, 11, 19, 27, 28, 21, 14, 7, 36, 37, 42, 49, 32, 33, 34, 43,
          51, 59,
        ].sort()
      );
    });
    describe("pawnMoves should return correct moves including en passant", () => {
      test("The pawn should be able to move 2 squares", () => {
        const pawnPos = { x: 1, y: 1 };
        const isWhite = false;
        const allies: number[] = [];
        const enemies: number[] = [];
        expect(
          c.pawnMoves(pawnPos, allies, enemies, isWhite, undefined).sort()
        ).toEqual([17, 25].sort());
      });
      test("The pawn should be able to only capture ennemy", () => {
        const pawnPos = { x: 6, y: 4 };
        const isWhite = true;
        const allies: number[] = [];
        const enemies = [29, 30, 31];
        expect(
          c.pawnMoves(pawnPos, allies, enemies, isWhite, undefined).sort()
        ).toEqual([29, 31].sort());
      });
      test("The pawn should be able capture, jump and move", () => {
        const pawnPos = { x: 5, y: 1 };
        const isWhite = false;
        const allies: number[] = [];
        const enemies = [22];
        expect(
          c.pawnMoves(pawnPos, allies, enemies, isWhite, undefined).sort()
        ).toEqual([21, 22, 29].sort());
      });
      test("The pawn should be able to capture en passant", () => {
        const pawnPos = { x: 5, y: 3 };
        const isWhite = true;
        const allies: number[] = [];
        const enemies = [30];
        expect(
          c.pawnMoves(pawnPos, allies, enemies, isWhite, 30).sort()
        ).toEqual([21, 22].sort());
      });
    });
    describe("dangerArea", () => {
      test("should mark squares attacked by black pieces in the default position", () => {
        const board: ChessBoard = [...c.defaultSetup.board];
        const danger = c.dangerArea(true, board).sort();
        const result: number[] = [
          16, 17, 18, 19, 20, 21, 22, 23, 11, 12, 13, 3, 5, 1, 8, 6, 15, 9, 14,
          10, 2, 4,
        ].sort();
        expect(danger).toEqual(result);
      });
      test("should mark squares attacked by black pieces", () => {
        const board: ChessBoard = [...testingBoard];
        const danger = c.dangerArea(true, board).sort();
        const result: number[] = [
          3, 5, 8, 9, 10, 11, 14, 15, 16, 17, 19, 20, 21, 22, 24, 25, 26, 27,
          29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 45, 46,
          48, 49, 50, 51, 53, 54, 55, 56, 58, 59, 60, 62,
        ].sort();
        expect(danger).toEqual(result);
      });
      test("should mark squares attacked by white pieces", () => {
        const board: ChessBoard = [...testingBoard];
        const danger = c.dangerArea(false, board).sort();
        const result: number[] = [
          1, 3, 5, 8, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 24, 26, 27, 28,
          30, 32, 33, 34, 36, 38, 40, 42, 43, 44, 45, 46, 47, 48, 49, 50, 52,
          53, 54, 55, 57, 61, 62, 63,
        ].sort();
        expect(danger).toEqual(result);
      });
    });
    describe("kingMoves should return moves including castling", () => {
      test("should return no moves", () => {
        const kingPos = { x: 5, y: 5 };
        const danger = c.dangerArea(
          true,
          c.decodeBoard("4r1r1/8/8/8/r7/5K2/r7/8 w - - 0 1").board
        );
        const kingMoves = c.kingMoves(kingPos, true, [], false, false, danger);
        expect(kingMoves).toEqual([]);
      });
      test("should return correct moves and King side castle", () => {
        const kingPos = { x: 4, y: 7 };
        const game = c.decodeBoard(
          "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1"
        ).board;
        const danger = c.dangerArea(true, game);
        const allies = c.getPieces(game, true);
        const kingMoves = c
          .kingMoves(kingPos, true, allies, true, true, danger)
          .sort();
        expect(kingMoves).toEqual([52, 61, 62].sort());
      });
      test("should not return a Queen side castle", () => {
        const kingPos = { x: 4, y: 7 };
        const game = c.decodeBoard(
          "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1"
        ).board;
        const danger = c.dangerArea(true, game);
        const allies = c.getPieces(game, true);
        const kingMoves = c
          .kingMoves(kingPos, true, allies, true, true, danger)
          .sort();
        expect(kingMoves).toEqual([52, 61, 62].sort());
      });
    });
  });
  describe("willCheck", () => {
    test("should return true since it opens a diagonal threat on the king", () => {
      const board: ChessBoard = c.decodeBoard(
        "rnbqk1nr/pppppppp/8/8/7b/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      ).board;
      expect(c.willCheck(true, board, 53, 45)).toEqual(true);
    });
  });
});
