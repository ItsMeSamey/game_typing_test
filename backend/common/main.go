package common

import (
  "os"
  "log"
  "runtime/debug"

  utils "github.com/ItsMeSamey/go_utils"
)

// Used to decide weather to enable stack trace
var IsDebug bool

func init() {
  if err := utils.Load(".env", func (k, v string) error {
    log.Println("Setting", k, "to", v)
    return os.Setenv(k, v)
  }); err != nil {
    log.Fatal("Error reading env: ", err)
  }

  IsDebug = os.Getenv("DEBUG") == "true"
}

/// Get an env variable, panic if variable not set
func MustGetEnv(key string) string {
  val, ok := os.LookupEnv(key)
  if !ok {
    panic("env not found: " + key)
  }
  return val
}

/// Recover handler, that converts panic's to os.Exit calls
func FatalizePanic(pre string) {
  if err := recover(); err != nil {
    log.Fatalf("Panic %s: %v\n%s", pre, err, debug.Stack())
  }
}

