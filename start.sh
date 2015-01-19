#!/bin/sh

hash tmux 2>/dev/null || { echo >&2 "tmux is not installed. You can download and install from http://tmux.sourceforge.net/.  Aborting."; exit 1; }
hash serve 2>/dev/null || { echo >&2 "serve is not installed. You can install with 'node install -g serve'.  Aborting."; exit 1; }

NAME=node-map-reduce
export DEBUG=node-map-reduce:*
export DEBUG_COLORS=true

tmux kill-session -t $NAME

tmux -2 new -d -s $NAME

tmux new-window -t $NAME:1
tmux split-window
tmux split-window
#tmux split-window

tmux select-layout even-vertical

#tmux select-pane -U
#tmux split-window -h
tmux select-pane -U
tmux split-window -h
tmux select-pane -U
tmux split-window -h

# Pane layout:
# 0 1
# 2 3
# 4 5
# 6 7
tmux select-pane -t 0
tmux send-keys "grunt controller:start --port 3010" C-m

tmux select-pane -t 1
tmux send-keys "cd ./test/server" C-m
tmux send-keys "./serve.sh" C-m
tmux resize-pane -x 50

tmux select-pane -t 2
tmux send-keys "grunt mapper:start --port 3011 --controller http://127.0.0.1:3010" C-m

tmux select-pane -t 3
tmux send-keys "grunt mapper:start --port 3012 --controller http://127.0.0.1:3010" C-m

tmux select-pane -t 4
tmux send-keys "alias exit='tmux kill-session -t $NAME'" C-m
tmux send-keys "./test/run.sh"

tmux -2 attach-session -t $NAME
