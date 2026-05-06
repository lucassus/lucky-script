# Feature Specification: While-loop `break` and `continue`

**Feature Branch**: `001-while-break-continue`
**Created**: 2026-05-06
**Status**: Draft
**Input**: User description: "while loop break and continue, see @roadmap.md"

## Clarifications

### Session 2026-05-06

- Q: When should misuse of `break` / `continue` outside a loop be detected? → A: Parse-time — the parser tracks "currently inside a loop body" state and rejects any `break`/`continue` that is not lexically nested inside a loop body (currently `while`; the same rule will apply to the future `for` loop). The program is rejected before execution begins.
- Q: Does the parser's "inside a loop body" state cross function definitions? → A: No — function definitions reset the state. A `break`/`continue` placed inside a function literal that is itself nested inside a loop is a parse error, because the function body is a fresh control-flow context. Matches Python / JavaScript semantics.

## User Scenarios & Testing *(mandatory)*

The users of this feature are programmers writing Lucky Script programs. Each user story below describes a programmer's experience writing and running such a program.

### User Story 1 - Exit a loop early with `break` (Priority: P1)

A programmer wants to stop iterating as soon as a runtime condition discovered inside the loop body is met (e.g., a search has found its target, or a sentinel value has been observed). Today they must contort the loop into a flag-controlled condition; with this feature they write `break` and the loop ends immediately.

**Why this priority**: Early termination is the most common reason to reach for loop control flow. Without `break`, every "search-style" loop in user programs has to invent a boolean flag, which is verbose and error-prone. Delivering `break` alone already removes that pain and produces a usable MVP.

**Independent Test**: Write a program that runs a `while (true)` loop incrementing a counter and uses `break` to exit when the counter reaches 5. Verify that execution leaves the loop after exactly 5 iterations and continues with whatever follows the loop.

**Acceptance Scenarios**:

1. **Given** a `while (true)` loop containing `if (i == 5) { break }` followed by `i = i + 1`, **When** the program runs starting from `i = 0`, **Then** the loop terminates with `i == 5` and execution proceeds to the statement after the loop.
2. **Given** a `while` loop whose body unconditionally executes `break` on the first iteration, **When** the program runs, **Then** the loop body executes exactly once and any code following the loop runs.
3. **Given** two nested `while` loops where `break` appears in the inner body, **When** the inner `break` is reached, **Then** only the inner loop terminates; the outer loop continues with its next iteration.

---

### User Story 2 - Skip an iteration with `continue` (Priority: P2)

A programmer wants to skip the remaining work in the current iteration and re-evaluate the loop condition (e.g., to ignore values that don't match a filter). Without `continue` they must wrap the rest of the body in an `if` to avoid the skipped work; with this feature they write `continue` and the body stays flat.

**Why this priority**: Common but less foundational than `break`. A loop body can always be rewritten with an `if` wrapper, so `continue` is primarily an ergonomics win. It is grouped with `break` because the language change is small once `break` is implemented.

**Independent Test**: Write a program that loops `i` from 1 to 10, uses `continue` to skip the iteration when `i == 3`, and prints `i` otherwise. Verify the printed output contains every number from 1 to 10 except 3, and verify the loop completes normally.

**Acceptance Scenarios**:

1. **Given** a `while (i < 10)` loop that increments `i` first and contains `if (i == 3) { continue }` followed by `print(i)`, **When** the program runs starting from `i = 0`, **Then** the printed output is `1, 2, 4, 5, 6, 7, 8, 9, 10` (3 is skipped) and the loop terminates normally when `i` reaches 10.
2. **Given** a `while` loop whose body executes `continue` on every iteration before any side effect, **When** the loop condition eventually becomes false, **Then** the loop terminates normally with no body side effects observed.
3. **Given** two nested `while` loops where `continue` appears in the inner body, **When** the inner `continue` is reached, **Then** only the inner iteration is skipped; the outer loop is unaffected.

---

### Edge Cases

- **`break` or `continue` outside any loop**: A program that places either keyword at the top level — or anywhere not lexically nested inside a loop body — is rejected at parse time. The program never begins executing; the error message must identify the offending statement.
- **`break` / `continue` nested inside `if` / `else` inside the loop**: Because `if` blocks do not create their own loop scope, the keywords still apply to the nearest enclosing `while` loop. A user writing `while (...) { if (...) { break } }` expects the outer `while` to terminate.
- **Statements after `break` / `continue` in the same block**: Code that follows either keyword in the same block is unreachable. The language must transfer control immediately and not execute the trailing statements.
- **Variables assigned before `break` / `continue`**: Per the existing scope model (only function calls open new scopes), variables modified inside the loop remain visible after the loop ends. `break` and `continue` must not change this.
- **Empty loop bodies**: `break` / `continue` are statements; an otherwise empty body containing only `break` is valid (loop runs once and exits).
- **Both keywords used in the same loop**: A loop body may contain both `break` and `continue` on different conditional paths; each keyword must behave independently.
- **Function definitions inside a loop body**: A function defined inside a `while` body opens a fresh control-flow context. `break` or `continue` placed inside that function body is a parse-time error even though the function definition itself is lexically inside a loop. (The function may be called from anywhere; its body is never lexically a continuation of the enclosing loop.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The language MUST accept `break` as a statement inside a `while` loop body.
- **FR-002**: The language MUST accept `continue` as a statement inside a `while` loop body.
- **FR-003**: When `break` executes, the program MUST stop the current iteration, MUST NOT re-evaluate the loop condition, and MUST resume execution at the first statement following the enclosing loop.
- **FR-004**: When `continue` executes, the program MUST stop the current iteration and MUST re-evaluate the enclosing loop's condition to decide whether to start a new iteration.
- **FR-005**: `break` and `continue` MUST act on the innermost enclosing `while` loop when used inside nested loops; outer loops MUST be unaffected by an inner `break` or `continue`.
- **FR-006**: `break` and `continue` MUST work when placed inside `if` / `else` blocks (or any other non-loop block) within a loop body, applying to the enclosing loop rather than the conditional block.
- **FR-007**: A program containing `break` or `continue` that is not lexically nested inside a loop body MUST be rejected at parse time with a clear error whose message identifies the offending statement (e.g., "`break` used outside a loop"). The program MUST NOT begin execution. The parser tracks loop-nesting state; when a future `for` loop is added, it is expected to participate in the same nesting state under the same rule.
- **FR-008**: Statements written after `break` or `continue` in the same block MUST NOT execute; control transfers immediately.
- **FR-009**: `break` and `continue` MUST NOT affect the values of variables already assigned earlier in the iteration; the existing scope semantics (only function calls open new scopes) MUST be preserved.
- **FR-010**: `break` and `continue` MUST be reserved words; programs that previously used them as identifiers MUST be rejected with a clear error.
- **FR-011**: A function definition (function literal) MUST reset the parser's "inside a loop body" state for the duration of its body. A `break` or `continue` placed inside a function body is treated as outside any loop with respect to FR-007, even when the function definition itself is lexically nested inside a `while` loop. Such a program MUST be rejected at parse time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A programmer can replace any flag-based "exit on condition" loop with a `break`-based loop that has at least one fewer variable and one fewer condition check, while producing the same output.
- **SC-002**: A programmer can replace any `if`-wrapped "skip on condition" loop body with a `continue`-based body whose nesting depth is reduced by one level, while producing the same output.
- **SC-003**: 100% of the acceptance scenarios in User Story 1 and User Story 2 pass on the reference implementation.
- **SC-004**: All existing Lucky Script programs and language tests continue to pass without modification (zero regressions in the existing `while`-loop and scope behavior).
- **SC-005**: Every program that uses `break` or `continue` outside of a loop is rejected, and the rejection message names the offending statement so the programmer can locate it without additional debugging.

## Assumptions

- **Scope is `while` loops only.** The roadmap mentions `for-each` as a future feature; this spec deliberately excludes `for-each` because that loop form does not yet exist. When `for-each` lands, `break` / `continue` will be expected to apply to it under the same rules, but extending the implementation is out of scope here.
- **Surface syntax is the existing brace-block form** (e.g., `while (cond) { ... if (cond2) { break } }`). The future `fn` / `end` block syntax overhaul listed in the roadmap is not yet in effect; this feature must work with the current grammar and remain compatible when the syntax overhaul lands.
- **No new keywords besides `break` and `continue`.** Both become reserved words. The existing reserved-word handling in the tokenizer is reused.
- **Misuse outside a loop is detected at parse time.** The parser tracks whether the current position is lexically nested inside a loop body (currently `while`; extensible to the future `for` loop) and rejects `break`/`continue` outside that context before execution begins. The interpreter still uses a control-flow-signal pattern (analogous to how `return` is implemented today) for the runtime semantics of valid `break`/`continue`, but signal handling never has to fall back to a "no enclosing loop" runtime error because the parser has already excluded that case.
- **Error reporting follows existing conventions** of the Lucky Script implementation (no new error type taxonomy is introduced beyond what is needed to distinguish "break/continue outside loop" from other errors).
- **Behavioral semantics match Python / JavaScript expectations** for `break` and `continue`. Programmers coming from those languages should not be surprised.
- **No interaction with `return`.** `return` inside a loop continues to exit the enclosing function (not just the loop), unchanged by this feature. `break` and `continue` only affect loops.
