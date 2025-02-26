package textgen

// Thread **Unsafe** Roll function
func Roll() {
  rollWordMarkov()
}

// Thread **Unsafe** Generator
func GenN(n int) (out []string) {
  out = make([]string, n, n)

  for i := range out {
    out[i] = genWordMarkov()
  }
  return
}

// Thread **Safe** Gen and Roll
func GenNReroll(n int) (out []string) {
  Roll()
  return GenN(n)
}

