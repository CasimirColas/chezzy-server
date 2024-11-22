import { decodeBoard, defaultSetup, encodePosition } from "@/chess/chess.js";
import { ClassicGameEngine } from "@/chess/classic.js";
import { describe, expect, test } from "vitest";

describe("ClassicGameEngine", () => {
  describe("initialization", () => {
    test("Should create the default starting position", () => {
      const game = new ClassicGameEngine();
      const info = game.info();
      expect(info.game.board).toEqual(defaultSetup.board);
      expect(info.game.whiteToPlay).toEqual(true);
      expect(info.game.canWhiteCastleKingSide).toEqual(true);
      expect(info.game.canWhiteCastleQueenSide).toEqual(true);
      expect(info.game.canBlackCastleKingSide).toEqual(true);
      expect(info.game.canBlackCastleQueenSide).toEqual(true);
      expect(info.game.passantPawn).toEqual(undefined);
      expect(info.game.halfMoveClock).toEqual(0);
      expect(info.game.fullMoves).toEqual(1);
    });
    test("Should create a custom starting position", () => {
      const game = new ClassicGameEngine(
        decodeBoard("8/8/8/8/8/1K4R1/8/1k6 b - - 0 1")
      );
      const info = game.info();

      let expectedBoard = new Array(64).fill(null);
      expectedBoard[41] = { name: "king", white: true };
      expectedBoard[46] = { name: "rook", white: true };
      expectedBoard[57] = { name: "king", white: false };
      expect(info.game.board).toEqual(expectedBoard);
      expect(info.game.whiteToPlay).toEqual(false);
    });
  });
  describe("mouvements", () => {
    describe("normal piece move", () => {
      const game = new ClassicGameEngine();
      test("should have all possible white moves", () => {
        const legalMoves = {
          "48": [40, 32],
          "49": [41, 33],
          "50": [42, 34],
          "51": [43, 35],
          "52": [44, 36],
          "53": [45, 37],
          "54": [46, 38],
          "55": [47, 39],
          "57": [40, 42],
          "62": [45, 47],
        };
        const createdMoves = game.info().moves;
        expect(createdMoves).toEqual(legalMoves);
      });
      test("should throw error for an inexisting piece", () => {
        expect(() =>
          game.request({ pieceToMove: 35, moveToPosition: 6 })
        ).toThrowError("Inexistant piece key");
      });
      test("should throw error for an immouvable piece", () => {
        expect(() =>
          game.request({ pieceToMove: 60, moveToPosition: 52 })
        ).toThrowError("Inexistant piece key");
      });
      test("should throw error for an impossible move", () => {
        expect(() =>
          game.request({ pieceToMove: 50, moveToPosition: 26 })
        ).toThrowError("Impossible move");
      });
    });
    describe("promotion", () => {
      test("should promote a pawn to a queen", () => {
        const game = new ClassicGameEngine(
          decodeBoard("8/6P1/1K6/1R6/8/8/7r/5k2 w - - 0 1")
        );
        game.request({ pieceToMove: 14, moveToPosition: 6, promotion: "q" });
        const info = game.info();
        expect(info.game.board[6]).toEqual({ name: "queen", white: true });
      });
      test("should promote a pawn to a knight", () => {
        const game = new ClassicGameEngine(
          decodeBoard("8/6P1/1K6/1R6/8/8/7r/5k2 w - - 0 1")
        );
        game.request({ pieceToMove: 14, moveToPosition: 6, promotion: "n" });
        const info = game.info();
        expect(info.game.board[6]).toEqual({ name: "knight", white: true });
      });
      test("should promote a pawn to a bishop", () => {
        const game = new ClassicGameEngine(
          decodeBoard("8/8/1K6/1R6/8/6k1/4p2r/8 b - - 0 1")
        );
        game.request({
          pieceToMove: 52,
          moveToPosition: 60,
          promotion: "b",
        });
        const info = game.info();
        expect(info.game.board[60]).toEqual({
          name: "bishop",
          white: false,
        });
      });
      test("should promote a pawn to a rook", () => {
        const game = new ClassicGameEngine(
          decodeBoard("8/8/1K6/1R6/8/6k1/4p2r/8 b - - 0 1")
        );
        game.request({
          pieceToMove: 52,
          moveToPosition: 60,
          promotion: "r",
        });
        const info = game.info();
        expect(info.game.board[60]).toEqual({
          name: "rook",
          white: false,
        });
      });
      test("should promote a pawn to a queen if the resquest was not defined", () => {
        const game = new ClassicGameEngine(
          decodeBoard("8/8/1K6/1R6/8/6k1/4p2r/8 b - - 0 1")
        );
        game.request({
          pieceToMove: 52,
          moveToPosition: 60,
        });
        const info = game.info();
        expect(info.game.board[60]).toEqual({
          name: "queen",
          white: false,
        });
      });
      test("should promote a pawn to a queen if the resquest is not a valid piece", () => {
        const game = new ClassicGameEngine(
          decodeBoard("8/8/1K6/1R6/8/6k1/4p2r/8 b - - 0 1")
        );
        game.request({
          pieceToMove: 52,
          moveToPosition: 60,
          // @ts-ignore testing promotion with a non valid piece
          promotion: "asdasdasdasd",
        });
        const info = game.info();
        expect(info.game.board[60]).toEqual({
          name: "queen",
          white: false,
        });
      });
    });
    describe("castling state", () => {
      test("king move should disable castling", () => {
        const game = new ClassicGameEngine(
          decodeBoard(
            "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1"
          )
        );
        expect(game.info().game.canWhiteCastleKingSide).toEqual(true);
        expect(game.info().game.canWhiteCastleQueenSide).toEqual(true);
        game.request({ pieceToMove: 60, moveToPosition: 52 });
        expect(game.info().game.canWhiteCastleKingSide).toEqual(false);
        expect(game.info().game.canWhiteCastleQueenSide).toEqual(false);
      });
      test("rook move queen side should disable castling", () => {
        const game = new ClassicGameEngine(
          decodeBoard(
            "r1bqkbnr/pppppppp/2n5/8/8/4PN2/PPPP1PPP/RNBQKB1R b KQkq - 0 1"
          )
        );
        expect(game.info().game.canBlackCastleKingSide).toEqual(true);
        expect(game.info().game.canBlackCastleQueenSide).toEqual(true);
        game.request({ pieceToMove: 0, moveToPosition: 1 });
        expect(game.info().game.canBlackCastleKingSide).toEqual(true);
        expect(game.info().game.canBlackCastleQueenSide).toEqual(false);
      });
      test("rook move king side should disable castling", () => {
        const game = new ClassicGameEngine(
          decodeBoard(
            "rnbqkbnr/pppp1ppp/4p3/8/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 0 1"
          )
        );
        expect(game.info().game.canWhiteCastleKingSide).toEqual(true);
        expect(game.info().game.canWhiteCastleQueenSide).toEqual(true);
        game.request({ pieceToMove: 63, moveToPosition: 62 });
        expect(game.info().game.canWhiteCastleKingSide).toEqual(false);
        expect(game.info().game.canWhiteCastleQueenSide).toEqual(true);
      });
    });
  });
  describe("game states", () => {
    test("should result in a checkmate", () => {
      const game = new ClassicGameEngine(
        decodeBoard("8/8/8/8/8/1K4R1/8/1k6 w - - 0 1")
      );
      game.request({ pieceToMove: 46, moveToPosition: 62 });
      expect(game.info().state).toEqual(0);
    });
    test("should result in a checkmate with promotion", () => {
      const game = new ClassicGameEngine(
        decodeBoard("1k6/6P1/1K6/8/8/8/8/8 w - - 0 1")
      );
      game.request({ pieceToMove: 14, moveToPosition: 6, promotion: "r" });
      expect(game.info().state).toEqual(0);
    });
    test("should result in a stalemate after promotion", () => {
      const game = new ClassicGameEngine(
        decodeBoard("1k6/6P1/1K6/8/8/8/8/8 w - - 0 1")
      );
      game.request({ pieceToMove: 14, moveToPosition: 6, promotion: "n" });
      expect(game.info().state).toEqual(2);
    });
    test("should result in a stalemate by repetition", () => {
      const game = new ClassicGameEngine(
        decodeBoard("8/8/5k2/5p2/5P2/5K2/8/8 w - - 0 1")
      );
      // 1
      game.request({ pieceToMove: 45, moveToPosition: 44 });
      game.request({ pieceToMove: 21, moveToPosition: 22 });
      game.request({ pieceToMove: 44, moveToPosition: 45 });
      game.request({ pieceToMove: 22, moveToPosition: 21 });
      // 2
      game.request({ pieceToMove: 45, moveToPosition: 44 });
      game.request({ pieceToMove: 21, moveToPosition: 22 });
      game.request({ pieceToMove: 44, moveToPosition: 45 });
      game.request({ pieceToMove: 22, moveToPosition: 21 });
      // 3
      game.request({ pieceToMove: 45, moveToPosition: 44 });
      game.request({ pieceToMove: 21, moveToPosition: 22 });
      game.request({ pieceToMove: 44, moveToPosition: 45 });
      game.request({ pieceToMove: 22, moveToPosition: 21 });

      expect(game.info().state).toEqual(2);
    });
    test("should result in a stalemate by 50 moves", () => {
      const game = new ClassicGameEngine(
        decodeBoard("8/8/5k2/5p2/5P2/5K2/8/8 w - - 48 1")
      );
      game.request({ pieceToMove: 45, moveToPosition: 44 });
      game.request({ pieceToMove: 21, moveToPosition: 22 });
      expect(game.info().state).toEqual(2);
    });
    describe("should result in a stalemate by insufficient material", () => {
      test("king vs king", () => {
        const game = new ClassicGameEngine(
          decodeBoard("8/8/Pk6/8/8/1K6/8/8 b - - 0 1")
        );
        game.request({ pieceToMove: 17, moveToPosition: 16 });
        expect(game.info().state).toEqual(2);
      });
      test("king vs king + bishop", () => {
        const game = new ClassicGameEngine(
          decodeBoard("8/8/4R3/3k4/8/1K6/3B4/8 b - - 0 1")
        );
        game.request({ pieceToMove: 27, moveToPosition: 20 });
        expect(game.info().state).toEqual(2);
      });
      test("king vs king + knight", () => {
        const game = new ClassicGameEngine(
          decodeBoard("8/8/8/3k4/5n2/8/2K5/3r4 w - - 0 1")
        );
        game.request({ pieceToMove: 50, moveToPosition: 59 });
        expect(game.info().state).toEqual(2);
      });
      test("king vs king + 2 knight", () => {
        const game = new ClassicGameEngine(
          decodeBoard("8/8/8/3k4/5n2/5n2/2K5/3r4 w - - 0 1")
        );
        game.request({ pieceToMove: 50, moveToPosition: 59 });
        expect(game.info().state).toEqual(2);
      });
    });
  });
  // Reproducing a full game from https://www.chess.com/analysis/game/live/90708604159?tab=review&move=0
  describe("play a full game", () => {
    const game = new ClassicGameEngine();
    // 1
    game.request({ pieceToMove: 52, moveToPosition: 44 });
    game.request({ pieceToMove: 12, moveToPosition: 28 });
    // 2
    game.request({ pieceToMove: 62, moveToPosition: 47 });
    game.request({ pieceToMove: 4, moveToPosition: 12 });
    // 3
    game.request({ pieceToMove: 60, moveToPosition: 52 });
    game.request({ pieceToMove: 6, moveToPosition: 21 });
    // 4
    game.request({ pieceToMove: 52, moveToPosition: 43 });
    game.request({ pieceToMove: 12, moveToPosition: 19 });
    // 5
    game.request({ pieceToMove: 43, moveToPosition: 34 });
    game.request({ pieceToMove: 3, moveToPosition: 12 });
    // 6
    game.request({ pieceToMove: 34, moveToPosition: 25 });
    game.request({ pieceToMove: 8, moveToPosition: 16 });
    // 7
    game.request({ pieceToMove: 25, moveToPosition: 24 });
    game.request({ pieceToMove: 1, moveToPosition: 18 });
    // 8
    game.request({ pieceToMove: 24, moveToPosition: 32 });
    game.request({ pieceToMove: 9, moveToPosition: 25 });
    // 9
    game.request({ pieceToMove: 32, moveToPosition: 41 });
    game.request({ pieceToMove: 16, moveToPosition: 24 });
    // 10
    game.request({ pieceToMove: 51, moveToPosition: 35 });
    game.request({ pieceToMove: 24, moveToPosition: 32 });
    // 11
    game.request({ pieceToMove: 41, moveToPosition: 42 });
    game.request({ pieceToMove: 19, moveToPosition: 27 });
    // 12
    game.request({ pieceToMove: 35, moveToPosition: 28 });
    game.request({ pieceToMove: 27, moveToPosition: 28 });
    // 13
    game.request({ pieceToMove: 57, moveToPosition: 51 });
    game.request({ pieceToMove: 18, moveToPosition: 33 });
    // 14
    game.request({ pieceToMove: 59, moveToPosition: 45 });
    game.request({ pieceToMove: 12, moveToPosition: 26 });
    // 15
    game.request({ pieceToMove: 61, moveToPosition: 34 });
    game.request({ pieceToMove: 26, moveToPosition: 34 });
    // 16
    game.request({ pieceToMove: 51, moveToPosition: 34 });
    game.request({ pieceToMove: 25, moveToPosition: 34 });
    // 17
    game.request({ pieceToMove: 63, moveToPosition: 59 });
    game.request({ pieceToMove: 21, moveToPosition: 36 });
    // 18
    game.request({ pieceToMove: 42, moveToPosition: 34 });
    game.request({ pieceToMove: 2, moveToPosition: 16 });
    test("final position should be correct", () => {
      expect(encodePosition(game.info().game.board)).toEqual(
        "r4b1r/2pp1ppp/b7/4k3/pnK1n3/4PQ1N/PPP2PPP/R1BR4"
      );
    });
    test("black won", () => {
      expect(game.info().state).toEqual(1);
    });
  });
});
