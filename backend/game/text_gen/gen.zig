//! compile with:
//! zig build-lib -OReleaseFast -femit-h=./ -fsingle-threaded -fstrip gen.zig

const std = @import("std");

const StringStruct = extern struct {
  ptr: [*]u8,
  len: LenType,
  cap: LenType,

  const LenType = u32;

  pub fn toArrayList(self: @This()) std.ArrayListUnmanaged(u8) {
    return .{
      .items = self.ptr[0..self.len],
      .capacity = self.capacity,
    };
  }

  pub fn fromArrayList(list: std.ArrayListUnmanaged(u8)) @This() {
    if (list.capacity > std.math.maxInt(LenType)) list.shrinkAndFree(gpa.allocator(), std.math.maxInt(LenType));
    return .{
      .ptr = list.items.ptr,
      .len = @intCast(list.items.len),
      .cap = @intCast(list.capacity),
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

var gpa: std.heap.GeneralPurposeAllocator(.{.thread_safe = true}) = .{};
var globalRng: std.Random.DefaultPrng = undefined;

/// This must be called before any other function in this library,
/// Calls to any other function before calling init are UB
pub export fn init() void {
  const seeds: [2]u64 = @bitCast(std.time.nanoTimestamp());
  globalRng = std.Random.DefaultPrng.init(seeds[0]^seeds[1]);

  const allocator = gpa.allocator();

  // Since models are generated on the same machine, endianness will be the same, so no need for copyable init
  char_markov = GenMarkov.initImmutableUncopyable(@embedFile("./text_gen/src/data/markov.char"), .{
    .allocator = allocator,
    .random = newRandom(),
  }) catch |e| std.debug.panic("Error: {!}", .{ e });

  word_markov = GenMarkov.initImmutableUncopyable(@embedFile("./text_gen/src/data/markov.word"), .{
    .allocator = allocator,
    .random = newRandom(),
  }) catch |e| std.debug.panic("Error: {!}", .{ e });
}

/// It is unsafe to call this function if init is not called;
pub export fn deinit() void {
  const allocator = gpa.allocator();

  char_markov.free(allocator);
  word_markov.free(allocator);

  const check = gpa.deinit();
  if (check != .ok) std.debug.panic("Error: memory leak detected", .{});

  gpa = .{};
}

/// New seeded rng (we really dont care about race conditions here!!)
fn newRandom() std.Random {
  return globalRng.random();
}

pub export fn genN(noalias state: *u32, n: u16, id: u8) StringStruct {
  const allocator = gpa.allocator();
  if (n == 0) return .{.ptr = undefined, .len = 0, .capacity = 0};

  switch (id) {
    inline 0, 1, 2, 3, 4 => |comptime_id| {
      const generator = switch (comptime_id) {
        0 => GenWordAlpha{.state = .{.random = newRandom()}, .data = .{}},
        1 => GenWordNonAlpha{.state = .{.random = newRandom()}, .data = .{}},
        2 => GenSentence{.state = .{.random = newRandom()}, .data = .{}},
        3 => char_markov.dupe(allocator),
        4 => word_markov,
      };
      defer if (comptime_id == 3) generator.free();

      if (state.* != std.math.maxInt(u32)) {
        generator.state().at = state.*;
      } else {
        generator.roll();
      }

      var array_list = std.ArrayListUnmanaged(u8){};

      for (0..n-1) |_| {
        const word = generator.gen();
        array_list.ensureUnusedCapacity(word.len + 1) catch @panic("OOM");
        array_list.appendSliceAssumeCapacity(word);
        array_list.appendAssumeCapacity(' ');
      }
      array_list.appendSlice(generator.gen()) catch @panic("OOM");

      state.* = generator.state().at;
      return StringStruct.fromArrayList(array_list);
    }
  }
}

pub export fn freeString(string: StringStruct) void {
  gpa.allocator().free(string.ptr[0..string.len]);
}

