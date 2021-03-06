#!/bin/sh

hash node 2>/dev/null || { echo >&2 "node is not installed. You can download and install from http://nodejs.org/.  Aborting."; exit 1; }
hash grunt 2>/dev/null || { echo >&2 "grunt is not installed. You can install it with npm -g grunt.  Aborting."; exit 1; }
hash tmux 2>/dev/null || { echo >&2 "tmux is not installed. You can download and install from http://tmux.sourceforge.net/.  Aborting."; exit 1; }

npm install

NAME=node-map-reduce
export DEBUG=nmr:*
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
#-----------------------------------------------------#
# 0  CONTROLLER                        6  USER        #
#                                                     #
#                                                     #
#                                                     #
#                                                     #
# 1  MAPPER                                           #
# 2  MAPPER                                           #
# 3  PARTITIONER                                      #
#                                                     #
# 4  REDUCER                                          #
# 5  REDUCER                            7  FILE-SVR   #
#-----------------------------------------------------#

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
if hash ./node_modules/serve/bin/serve 2>/dev/null; then
  tmux send-keys "cd ./test/manual/server" C-m
  tmux send-keys "./serve.sh" C-m
else
  tmux send-keys "npm install -g serve"
fi

tmux select-pane -t 6

if hash ./node_modules/serve/bin/serve 2>/dev/null; then
  tmux send-keys "export INPUT_URL='http://localhost:3999/sample_text.txt'" C-m
else
  tmux send-keys "export INPUT_URL='http://www.gutenberg.org/files/17192/17192-8.txt'" C-m
fi
tmux send-keys "alias exit='tmux kill-session -t $NAME'" C-m
tmux send-keys "./test/manual/run.sh"

tmux setw -g mode-mouse on
tmux set -g mouse-select-pane on
tmux set -g mouse-resize-pane on
tmux set -g mouse-select-window on

tmux -2 attach-session -t $NAME
