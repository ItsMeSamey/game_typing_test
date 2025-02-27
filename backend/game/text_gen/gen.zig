//! compile with:
//! zig build-lib -OReleaseFast -femit-h=./ -fsingle-threaded -fstrip gen.zig

const std = @import("std");

const StringStruct = extern struct {
  ptr: [*]const c_char,
  len: c_int,

  pub fn formSlice(slice: []const u8) @This() {
    return .{
      .ptr = @ptrCast(slice.ptr),
      .len = @intCast(slice.len),
    };
  }
};

const GenWords = @import("text_gen/src/genWords.zig").GetComptimeWordGen;
const GenWordAlpha = GenWords(.{.defaultData = @embedFile("./text_gen/src/data/words.txt")});
const GenWordNonAlpha = GenWords(.{.defaultData = @embedFile("./text_gen/src/data/words_non_alpha.txt")});
const GenSentence = GenWords(.{.defaultData = @embedFile("./text_gen/src/data/words_non_alpha.txt")});

const GenMarkov = @import("text_gen/src/genMarkov.zig");

var char_markov: GenMarkov.AnyMarkovGen = undefined;
var word_markov: GenMarkov.AnyMarkovGen = undefined;

fn getWordAlpha() GenWordAlpha { return .{.state = undefined, .data = undefined}; }
fn getWordNonAlpha() GenWordNonAlpha { return .{.state = undefined, .data = undefined}; }
fn getSentence() GenSentence { return .{.state = undefined, .data = undefined}; }
fn getMarkovChar() GenMarkov.AnyMarkovGen { return char_markov.dupe(); }
fn getMarkovWord() GenMarkov.AnyMarkovGen { return word_markov.dupe(); }

var gpa: std.heap.GeneralPurposeAllocator(.{}) = .{};

/// This must be called before any other function in this library,
/// Calls to any other function before calling init are UB
pub export fn init() void {
  const allocator = gpa.allocator();

  // Since models are generated on the same machine, endianness will be the same, so no need for copyable init
  char_markov = GenMarkov.initImmutableUncopyable(@embedFile("./text_gen/src/data/markov.char"), allocator)
    catch |e| std.debug.panic("Error: {!}", .{ e });
  word_markov = GenMarkov.initImmutableUncopyable(@embedFile("./text_gen/src/data/markov.word"), allocator)
    catch |e| std.debug.panic("Error: {!}", .{ e });
}

/// It is unsafe to call this function if init is not called;
pub export fn deinit() void {
  word_markov.free();

  const check = gpa.deinit();
  if (check != .ok) std.debug.panic("Error: memory leak detected", .{});

  gpa = .{};
}

// -> word_markov specific functions

/// Generate a random word
pub export fn genWordMarkov() string {
  return sliceToString(word_markov.gen());
}

/// Re-roll the markov generator
pub export fn rollWordMarkov() void {
  word_markov.roll();
}

