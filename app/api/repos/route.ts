export async function GET() {
  const username = 'shane0413';
  const token = process.env.GITHUB_TOKEN;

  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`,
        },
      }
    );

    const repos = await response.json();
    
    return Response.json(repos);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch repos' }, { status: 500 });
  }
}