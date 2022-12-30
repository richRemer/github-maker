package = $(shell jq -r .name < package.json)
version = $(shell jq -r .version < package.json)
installer = $(package)-$(version).tgz

default: build

build: node_modules

installer: $(installer)

install: $(installer)
	npm install -g $<

clean:
	rm -fr node_modules

distclean: clean
	rm -fr *.tgz

$(installer): node_modules
	npm pack

node_modules: package.json package-lock.json
	npm install
	@touch $@

.PHONY: default build insdtall clean distclean
