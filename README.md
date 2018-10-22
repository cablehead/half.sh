# half.sh

## run locally

$ git clone https://github.com/cablehead/half.sh
$ cd half.sh

# build the static web ui
$ cd www
$ webpack --mode development

$ bin/half.sh


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
