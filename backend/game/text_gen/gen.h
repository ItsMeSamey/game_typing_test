// Define the string struct as used in Zig
typedef struct string {
  const char* ptr; // Pointer to the string data
  int len;       // Length of the string
} string;

// Function to initialize the text generation library
void init(void);

// Function to deinitialize the text generation library
void deinit(void);

// Generate a random word using Markov chain
string genWordMarkov(void);

// Re-roll the word Markov generator
void rollWordMarkov(void);

