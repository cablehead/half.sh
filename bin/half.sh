#!/bin/bash

test -z $1 && ROOT=~/.half.sh || ROOT=$1

export BIN=$(realpath $(dirname $0))

trap "exit" INT TERM
trap "kill 0" EXIT

$BIN/serve $ROOT &
open -g http://localhost:8000
sleep 0.5

echo REPL
$BIN/repl $ROOT
