# usages
first run `go generate ./...` to generate stuff (only needed to be run once)
<br>
run `go run main.go` to run the server

or compile with `go build -o dist/main -ldflags='-s -w' main.go`
<br>
and run in docker with `docker-compose up --build`

# Where is what?

### [env variables info](./ENV.md)

### `./common`
`main.go` contains `.env` loader
<br>
nothing else here yet

### `./db`
handles connection to the database

### `./router`
all the routing is done here
