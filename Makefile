.DEFAULT_GOAL := help

ARGS ?=
TITLE ?=
NO_COLOR ?=

ifeq ($(NO_COLOR),)
ifneq ($(TERM),dumb)
ESC := $(shell printf '\033')
RESET := $(ESC)[0m
BOLD := $(ESC)[1m
DIM := $(ESC)[2m
RED := $(ESC)[31m
GREEN := $(ESC)[32m
YELLOW := $(ESC)[33m
BLUE := $(ESC)[34m
MAGENTA := $(ESC)[35m
CYAN := $(ESC)[36m
endif
endif

KNOWN_TARGETS := help install browsers scenario casebook test test-local auth preflight reclaim \
	test-ui test-headed test-debug report codegen summarize notify test-unit lint \
	lint-fix typecheck format format-check check perf
POSITIONAL_GOALS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
COMMAND_ARGS := $(strip $(ARGS) $(POSITIONAL_GOALS))
SCENARIO_TITLE := $(strip $(TITLE) $(POSITIONAL_GOALS))

.PHONY: $(KNOWN_TARGETS)

# Extra command-line goals are accepted as positional arguments and consumed by
# the requested command instead of being treated as separate make targets.
ifneq ($(filter $(firstword $(MAKECMDGOALS)),$(KNOWN_TARGETS)),)
ifneq ($(strip $(POSITIONAL_GOALS)),)
.PHONY: $(POSITIONAL_GOALS)
$(POSITIONAL_GOALS):
	@:

.DEFAULT:
	@:
endif
endif

define run_step
	@printf "\n$(CYAN)▶$(RESET) $(BOLD)%s$(RESET)\n" "$(1)"
	@$(2) || { status=$$?; printf "$(RED)✖$(RESET) %s $(DIM)(exit %s)$(RESET)\n" "$(1)" "$$status" >&2; exit $$status; }; \
	printf "$(GREEN)✔$(RESET) %s\n" "$(1)"
endef

help:
	@printf "\n$(BOLD)$(CYAN)obi-e2e$(RESET) $(DIM)developer commands$(RESET)\n"
	@printf "$(DIM)────────────────────────────────────────────────────────────$(RESET)\n\n"
	@printf "$(BOLD)setup$(RESET)\n"
	@printf "  $(GREEN)make install$(RESET)                    install dependencies\n"
	@printf "  $(GREEN)make browsers$(RESET)                   install chromium\n"
	@printf "\n$(BOLD)scenarios$(RESET)\n"
	@printf "  $(GREEN)make scenario \"...\"$(RESET)             create a scenario starter\n"
	@printf "  $(GREEN)make casebook scenarios$(RESET)            validate scenarios\n"
	@printf "\n$(BOLD)tests$(RESET)\n"
	@printf "  $(GREEN)make test [path]$(RESET)                  run playwright tests\n"
	@printf "  $(GREEN)make test-local [path]$(RESET)            test localhost:3001\n"
	@printf "  $(GREEN)make test-headed [path]$(RESET)          watch the browser\n"
	@printf "  $(GREEN)make test-ui [path]$(RESET)               open playwright ui\n"
	@printf "  $(GREEN)make test-debug [path]$(RESET)           debug tests\n"
	@printf "\n$(BOLD)quality$(RESET)\n"
	@printf "  $(GREEN)make check$(RESET)                        format, lint, types, unit tests\n"
	@printf "  $(GREEN)make format$(RESET)                       format the repository\n"
	@printf "  $(GREEN)make format-check$(RESET)                check formatting only\n"
	@printf "  $(GREEN)make lint$(RESET)                         run lint\n"
	@printf "  $(GREEN)make lint-fix$(RESET)                     fix lint issues\n"
	@printf "  $(GREEN)make typecheck$(RESET)                    run typescript checks\n"
	@printf "\n$(BOLD)reports and operations$(RESET)\n"
	@printf "  $(GREEN)make report$(RESET)                       open the last playwright report\n"
	@printf "  $(GREEN)make preflight$(RESET)                    check backend services\n"
	@printf "  $(GREEN)make auth$(RESET)                         refresh live auth\n"
	@printf "  $(GREEN)make reclaim$(RESET)                      reclaim abandoned resources\n"
	@printf "  $(GREEN)make codegen$(RESET)                      open playwright codegen\n"
	@printf "  $(GREEN)make summarize$(RESET)                    summarize test results\n"
	@printf "  $(GREEN)make notify$(RESET)                       send a test notification\n"
	@printf "  $(GREEN)make perf$(RESET)                        run lighthouse checks\n"
	@printf "\n$(BOLD)examples$(RESET)\n"
	@printf "  $(YELLOW)make scenario \"synaptome build\"$(RESET)\n"
	@printf "  $(YELLOW)make test scenarios/workflows$(RESET)\n"
	@printf "  $(YELLOW)make test -- --grep @credits$(RESET)\n"
	@printf "\n$(DIM)positional arguments are forwarded. use -- before playwright flags.\n"
	@printf "ARGS=\"...\" and TITLE=\"...\" remain supported. set NO_COLOR=1 for plain output.$(RESET)\n\n"

install:
	$(call run_step,install dependencies,bun install)

browsers:
	$(call run_step,install chromium,bunx playwright install --with-deps chromium)

scenario:
	@if [ -z "$(SCENARIO_TITLE)" ]; then printf "$(RED)✖$(RESET) usage: make scenario \"<scenario title>\"\n" >&2; exit 1; fi
	$(call run_step,create scenario: $(SCENARIO_TITLE),bun scripts/scenario.ts "$(SCENARIO_TITLE)")

casebook:
	$(call run_step,validate scenarios,bun tools/casebook/validator/cli.ts $(COMMAND_ARGS))

test:
	$(call run_step,run playwright tests,bun --bun playwright test $(COMMAND_ARGS))

test-local:
	$(call run_step,run local playwright tests,E2E_BASE_URL=http://localhost:3001 bun --bun playwright test $(COMMAND_ARGS))

auth:
	$(call run_step,refresh live auth,E2E_RUN_ID=live bun --bun playwright test --project=setup $(COMMAND_ARGS))

preflight:
	$(call run_step,run preflight,bun scripts/ci/preflight.ts $(COMMAND_ARGS))

reclaim:
	$(call run_step,reclaim abandoned resources,bun scripts/ci/reclaim.ts $(COMMAND_ARGS))

test-ui:
	$(call run_step,open playwright ui,bun --bun playwright test --ui $(COMMAND_ARGS))

test-headed:
	$(call run_step,run headed tests,bun --bun playwright test --headed $(COMMAND_ARGS))

test-debug:
	$(call run_step,debug tests,bun --bun playwright test --debug $(COMMAND_ARGS))

report:
	$(call run_step,open playwright report,bun --bun playwright show-report $(COMMAND_ARGS))

codegen:
	$(call run_step,open playwright codegen,bun --bun playwright codegen "$${E2E_BASE_URL:-https://staging.openbraininstitute.org}" $(COMMAND_ARGS))

summarize:
	$(call run_step,summarize test results,bun scripts/ci/summarize-results.ts test-results/results.json test-results $(COMMAND_ARGS))

notify:
	$(call run_step,send test notification,bun scripts/ci/notify.ts $(COMMAND_ARGS))

test-unit:
	$(call run_step,run unit tests,bun test ./scripts ./fixtures ./locators ./tools ./perf)

lint:
	$(call run_step,run lint,./node_modules/.bin/oxlint $(COMMAND_ARGS))

lint-fix:
	$(call run_step,fix lint issues,./node_modules/.bin/oxlint --fix $(COMMAND_ARGS))

typecheck:
	$(call run_step,run typescript checks,./node_modules/.bin/tsc --noEmit $(COMMAND_ARGS))

format:
	$(call run_step,format repository,./node_modules/.bin/oxfmt .)

format-check:
	$(call run_step,check formatting,./node_modules/.bin/oxfmt --check .)

check: format-check lint typecheck test-unit

perf:
	$(call run_step,run lighthouse checks,bun perf/run.ts $(COMMAND_ARGS))
