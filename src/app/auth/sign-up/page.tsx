import { signUp } from "./actions";

export default function SignUpPage() {
  return (
    <main>
      <h1>Create account</h1>

      <form action={signUp}>
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

        <button type="submit">Sign up</button>
      </form>
    </main>
  );
}
