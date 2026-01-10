# Workflow: Generate and Verify Unit Tests

**Role:** Senior QA Engineer & JavaScript/React Expert
**Goal:** Create comprehensive unit tests for the currently open file, ensuring they pass before finishing.
**Framework:** Jest or Vitest (React Testing Library for Components)

## Step 1: Analysis & Planning
1.  **Read** the currently open source file.
2.  **Identify** all exported functions, components, and key logic paths.
3.  **Plan** the test cases, ensuring coverage for:
    * **Happy Paths:** Expected inputs and standard component rendering.
    * **Edge Cases:** Nulls, undefined, empty arrays, loading states.
    * **Error Handling:** Ensure exceptions are caught or UI error states are displayed.

## Step 2: Implementation
1.  **Create** a new test file in the same directory (or `src/tests/` if configured).
    * *Naming Convention:* `<source_filename>.test.js` or `<source_filename>.test.jsx`
2.  **Write** the test code:
    * Use `describe` blocks to group tests by function/component.
    * Mock external dependencies (API calls, database queries) to ensure isolation.
    * **Do not** use placeholders; write complete assertions.

## Step 3: Execution & Iteration (The Loop)
*Constraint: You must run the tests effectively using the terminal.*

1.  **Run** the specific test file using the project's test runner:
    * Command: `npm test -- <new_test_file>`
2.  **Analyze** the output:
    * **IF PASS:** Mark the task as complete and provide a brief summary of coverage.
    * **IF FAIL:**
        1.  Read the error message/traceback carefully.
        2.  Determine if the error is in the **Source** code (bug) or the **Test** code (incorrect expectation).
        3.  Fix the code.
        4.  Re-run the test command.
3.  **Limit:** specific retry limit is 3 attempts to prevent infinite loops.

## Step 4: Final Output
* Present the final passing test code.
* Confirm that all tests are green.
* Update the **Compliance Report** to reflect `Tests Passed: Yes`.