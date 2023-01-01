package = $(shell jq -r .name < package.json)
version = $(shell jq -r .version < package.json)
sources = $(shell find src -name '*'.js -o -type d) server.js lib.js
installer = $(package)-$(version).tgz

default: build

build: $(installer)

install: $(installer)
	npm install -g $<

clean:
	rm -fr node_modules

distclean: clean
	rm -fr *.tgz

$(installer): node_modules $(sources)
	npm pack

node_modules: package.json package-lock.json
	npm install
	@touch $@

.PHONY: default build install clean distclean
