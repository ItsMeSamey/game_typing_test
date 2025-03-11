// Define the string struct as used in Zig
#include <stdint.h>
typedef struct StringStruct {
  uint8_t* ptr; // Pointer to the string data
  uint32_t len; // Length of the string
} StringStruct;

// Function to initialize the generation library
void init(void);

// Function to deinitialize the generation library
void deinit(void);

// Generate a string of random words
// New state is stored in state pointer
StringStruct genN(uint32_t *state, uint16_t n, uint8_t id);

// Free the string struct
void freeString(StringStruct string);

