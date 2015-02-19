DEBUG=nmr:*

start:
	./start.sh

test:
	./node_modules/.bin/mocha --reporter list

frontend:
	cd ./frontend && \
	meteor run

test-servers:
	${MAKE} -j7 \
	test-controller-3201 \
	test-mapper-3202 \
	test-mapper-3203 \
	test-partitioner-3204 \
	test-reducer-3205 \
	test-reducer-3206

test-controller-3201:
	DEBUG=$(DEBUG) \
	PORT=3201 \
	node ./app/controller/bin/server.js

test-mapper-3202:
	DEBUG=$(DEBUG) \
	PORT=3202 \
	node ./app/mapper/bin/server.js http://localhost:3201

test-mapper-3203:
	DEBUG=$(DEBUG) \
	PORT=3203 \
	node ./app/mapper/bin/server.js http://localhost:3201

test-partitioner-3204:
	DEBUG=$(DEBUG) \
	PORT=3204 \
	node ./app/partitioner/bin/server.js http://localhost:3201

test-reducer-3205:
	DEBUG=$(DEBUG) \
	PORT=3205 \
	node ./app/reducer/bin/server.js http://localhost:3201

test-reducer-3206:
	DEBUG=$(DEBUG) \
	PORT=3206 \
	node ./app/reducer/bin/server.js http://localhost:3201

.PHONY: test frontend
