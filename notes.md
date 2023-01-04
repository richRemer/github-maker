# list build units which are enabled
systemctl --plain list-dependencies github-build.target | tail -n+2

 * build for testing
 * build for production
 * publish artifacts
 * install

Development
 - push changes to feature branches
 - create PR
 - GitHub sends "push" event
 - makerd triggers build

github-build@.service
 - make
 - make test
 - make publish

github-build@.service
 - requires github-checkout@.service
 - requires github-workspace@.service
 - success triggers github-test@.service
 - success triggers github-publish@.service

Makefile
 - default builds for testing

Steps
 - compile: make build succeeds
 - test: make test succeeds
 - publish: save tarball, package, or executable somewhere

 - install: install from publish target
 - verify: integration testing succeeds
 - deploy: flip a switch

