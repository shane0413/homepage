export async function GET() {
  const username = 'shane0413'; // 改成你的GitHub用户名

  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    const repos = await response.json();
    
    return Response.json(repos);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch repos' }, { status: 500 });
  }
}