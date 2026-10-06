"use client";

import { useActionState } from "react";

import { signUp, type SignUpState } from "./actions";

const initialState: SignUpState = {};

const SignUpForm = () => {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction}>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
        />
      </div>

      {state.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Creating account..." : "Sign up"}
      </button>
    </form>
  );
};

export default SignUpForm;
