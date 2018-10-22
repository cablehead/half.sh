#!/bin/bash

test -z $1 && ROOT=~/.half.sh || ROOT=$1

export PATH=$PATH:$(dirname $0)/deps/$(uname)

export BIN=$(realpath $(dirname $0))

export HSH_TRAP=1
trap "exit" INT TERM
trap "kill 0" EXIT

$BIN/serve $ROOT &

sleep 0.5
open -g http://localhost:8000
$BIN/repl $ROOT
