export async function GET() {
  const username = 'shane0413';
  const token = process.env.GITHUB_TOKEN;

  try {
    const response = await fetch(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`,
        },
      }
    );

    if (!response.ok) {
      return Response.json({ error: `API returned ${response.status}` }, { status: response.status });
    }

    const user = await response.json();
    return Response.json(user);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}