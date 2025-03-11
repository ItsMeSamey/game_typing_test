//! compile with:
//! zig build-lib -OReleaseFast -femit-h=./ -fsingle-threaded -fstrip gen.zig

const std = @import("std");

const StringStruct = extern struct {
  ptr: [*]const c_char,
  len: u32,
  capacity: u32,

  pub fn toArrayList(self: @This()) std.ArrayListUnmanaged(u8) {
    return .{
      .items = self.ptr[0..self.len],
      .capacity = self.capacity,
    };
  }

  pub fn fromArrayList(list: std.ArrayListUnmanaged(u8)) @This() {
    if (list.capacity > std.math.maxInt(u32)) list.shrinkAndFree(gpa.allocator(), std.math.maxInt(u32));
    return .{
      .ptr = list.items.ptr,
      .len = @intCast(list.items.len),
      .capacity = @intCast(list.capacity),
    };
  }
};

const GenWords = @import("text_gen/src/genWords.zig").GetComptimeWordGen;
const GenWordAlpha = GenWords(.{.defaultData = @embedFile("./text_gen/src/data/words.txt")});
const GenWordNonAlpha = GenWords(.{.defaultData = @embedFile("./text_gen/src/data/words_non_alpha.txt")});
const GenSentence = GenWords(.{.defaultData = @embedFile("./text_gen/src/data/words_non_alpha.txt")});

const GenMarkov = @import("text_gen/src/genMarkov.zig");

// const TypeInt = enum(u2) {
//   WordAlpha = 0,
//   WordNonAlpha = 1,
//   Sentence = 2,
//   Markov = 3,
//
//   pub fn fromType(comptime T: type) TypeInt {
//     return switch (T) {
//       GenWordAlpha => .WordAlpha,
//       GenWordNonAlpha => .WordNonAlpha,
//       GenSentence => .Sentence,
//       GenMarkov.AnyMarkovGen => .Markov,
//       else => @compileError("Invalid type"),
//     };
//   }
//
//   pub fn toType(comptime self: TypeInt) type {
//     return switch (self) {
//       .WordAlpha => GenWordAlpha,
//       .WordNonAlpha => GenWordNonAlpha,
//       .Sentence => GenSentence,
//       .Markov => GenMarkov.AnyMarkovGen,
//     };
//   }
// };

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

// fn create(generator: anytype) *anyopaque {
//   const alignment = @max(@alignOf(generator), 1 << @bitSizeOf(TypeInt));
//   const mem = gpa.allocator().alignedAlloc(@TypeOf(generator), alignment, @sizeOf(generator)) catch @panic("OOM");
//
//   const newGenerator: *@TypeOf(generator) = @ptrCast(mem.ptr);
//   newGenerator.roll();
//
//   @memcpy(newGenerator, &generator);
//   return @ptrFromInt(@intFromPtr(newGenerator) | TypeInt.fromType(@TypeOf(generator)));
// }
//
// pub export fn getWordAlpha() *anyopaque { return create(GenWordAlpha{.state = .{.random = newRandom()}, .data = .{}}); }
// pub export fn getWordNonAlpha() *anyopaque { return create(GenWordNonAlpha{.state = .{.random = newRandom()}, .data = .{}}); }
// pub export fn getSentence() *anyopaque { return create(GenSentence{.state = .{.random = newRandom()}, .data = .{}}); }
// pub export fn getMarkovChar() *anyopaque { return create(char_markov.dupe(gpa.allocator())); }
// pub export fn getMarkovWord() *anyopaque { return create(word_markov.dupe(gpa.allocator())); }

pub export fn genN(state: u32, n: u16, id: u8) StringStruct {
  const allocator = gpa.allocator();
  if (n == 0) return .{.ptr = undefined, .len = 0, .capacity = 0};

  switch (id) {
    inline 0, 1, 2, 3, 4 => |comptime_id| {
      const generator = switch (comptime_id) {
        0 => GenWordAlpha{.state = .{.random = newRandom()}, .data = .{}},
        1 => GenWordNonAlpha{.state = .{.random = newRandom()}, .data = .{}},
        2 => GenSentence{.state = .{.random = newRandom()}, .data = .{}},
        3 => char_markov.dupe(allocator),
        4 => word_markov.dupe(allocator),
      };
      if (state != std.math.maxInt(u32)) generator.state().at = state;
      var array_list = std.ArrayListUnmanaged(u8){};

      for (0..n-1) |_| {
        const word = generator.gen();
        array_list.ensureUnusedCapacity(word.len + 1) catch @panic("OOM");
        array_list.appendSliceAssumeCapacity(word);
        array_list.appendAssumeCapacity(' ');
      }
      array_list.appendSlice(generator.gen()) catch @panic("OOM");

      return StringStruct.fromArrayList(array_list);
    }
  }
}

pub export fn free(string: StringStruct) void {
  gpa.allocator().free(string.ptr[0..string.len]);
}

