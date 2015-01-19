#!/bin/sh

hash tmux 2>/dev/null || { echo >&2 "tmux is not installed. You can download and install from http://tmux.sourceforge.net/.  Aborting."; exit 1; }
hash serve 2>/dev/null || { echo >&2 "serve is not installed. You can install with 'node install -g serve'.  Aborting."; exit 1; }

NAME=node-map-reduce
export DEBUG=node-map-reduce:*
export DEBUG_COLORS=true

tmux kill-session -t $NAME

tmux -2 new -d -s $NAME

tmux new-window -t $NAME:1
tmux split-window -h -p 30
tmux select-pane -t 0
tmux split-window -l 30
tmux split-window -l 25
tmux split-window -l 20
tmux split-window -l 10
tmux split-window -l 5

tmux select-pane -t 6
tmux split-window
tmux select-pane -t 7
tmux resize-pane -y 5

# Pane layout:
# 0  CONTROLLER                  6  USER
# 1  MAPPER                      7  FILE-SERVER
# 2  MAPPER
# 3  PARTITIONER
# 4  REDUCER
# 5  REDUCER

tmux select-pane -t 0
tmux send-keys "grunt controller:start --port 3010" C-m

tmux select-pane -t 1
tmux send-keys "grunt mapper:start --port 3011 --controller http://127.0.0.1:3010" C-m

tmux select-pane -t 2
tmux send-keys "grunt mapper:start --port 3012 --controller http://127.0.0.1:3010" C-m

tmux select-pane -t 3
tmux send-keys "grunt partitioner:start --port 3013 --controller http://127.0.0.1:3010" C-m

tmux select-pane -t 4
tmux send-keys "grunt reducer:start --port 3014 --controller http://127.0.0.1:3010" C-m

tmux select-pane -t 5
tmux send-keys "grunt reducer:start --port 3015 --controller http://127.0.0.1:3010" C-m

tmux select-pane -t 7
tmux send-keys "cd ./test/server" C-m
tmux send-keys "./serve.sh" C-m

tmux select-pane -t 6
tmux send-keys "alias exit='tmux kill-session -t $NAME'" C-m
tmux send-keys "./test/run.sh"

tmux -2 attach-session -t $NAME
