DEBUG=nmr:*

start:
	./start.sh

verbose-test:
	DEBUG=nmr:* ./node_modules/.bin/mocha --reporter list

test:
	./node_modules/.bin/mocha --reporter list

frontend:
	cd ./frontend && \
	meteor run

controller:
	node ./app/controller/bin/server.js

mapper:
	node ./app/mapper/bin/server.js $(CONTROLLER_ADDRESS)

reducer:
	node ./app/reducer/bin/server.js $(CONTROLLER_ADDRESS)

partitioner:
	node ./app/partitioner/bin/server.js $(CONTROLLER_ADDRESS)

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
	$(MAKE) controller

test-mapper-3202:
	DEBUG=$(DEBUG) \
	PORT=3202 \
	CONTROLLER_ADDRESS=http://localhost:3201 \
	$(MAKE) mapper

test-mapper-3203:
	DEBUG=$(DEBUG) \
	PORT=3203 \
	CONTROLLER_ADDRESS=http://localhost:3201 \
	$(MAKE) mapper

test-partitioner-3204:
	DEBUG=$(DEBUG) \
	PORT=3204 \
	CONTROLLER_ADDRESS=http://localhost:3201 \
	$(MAKE) partitioner

test-reducer-3205:
	DEBUG=$(DEBUG) \
	PORT=3205 \
	CONTROLLER_ADDRESS=http://localhost:3201 \
	$(MAKE) reducer

test-reducer-3206:
	DEBUG=$(DEBUG) \
	PORT=3206 \
	CONTROLLER_ADDRESS=http://localhost:3201 \
	$(MAKE) reducer

.PHONY: test frontend
