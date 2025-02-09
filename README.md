git clone [your-repo-url]
cd [your-repo-name]
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[dbname]
NODE_ENV=development
REPL_ID=[any-random-string-for-session-secret]
```

4. Initialize the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev