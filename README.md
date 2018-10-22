# half.sh

## run locally

```
$ git clone https://github.com/cablehead/half.sh
$ cd half.sh

# install yarn
$ brew install yarn  # (macOS)

# build the static web ui
$ cd www
$ yarn install
$ yarn build-dev
$ cd ..

# install jq
$ brew install jq  # (macOS)

$ bin/half.sh
```

## commands

Usage is currently vi centric. Open an issue to discuss adding your favorite
mode of interaction! e.g. emacs.

Careful! This is currently a very sharp knife. There are no confirm prompts or
undo.

```
* <entr>: edit currently selected node
* '|': pipe the current node to create a new dependent node
* 'h': select the node to the right
* 'l': select the node to the left
* 'k': select the node above
* 'j': select the node below
* 'i': insert a new root node
* 'd': delete the currently selected node and all of it's dependents
* 'c': clone the currently selected node and all of it's dependents
* 'r': prompts for a refresh interval, a number in seconds, for how regularly to refresh the currently selected node

* 'I' (capital): insert a new project (dashboard)
* ',': rename the current project
* 'D' (capital): delete the current project
```


### session structure

```
ROOT/
  flake
  stream
  P -> project/<id>
  project/
    <id>/
      name
      N -> node/<id>
      node/
        <id>/
          run
          stdin -> ../<id>/stdout
          stdout
          stderr
          status
          starred
          refresh
```

```
{"project": {
    "515366767042576": {
        "name": "squirrel",
        "node": {
