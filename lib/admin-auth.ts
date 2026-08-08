// 服务端校验：写操作（创建/更新/删除/查看全部文章）需要在请求头中带上
// x-admin-password，且必须和 ADMIN_PASSWORD 环境变量一致。
// 前端在通过 /api/admin/verify-password 登录成功后，会把密码暂存在
// sessionStorage 中，并在后续的管理类请求里附带这个请求头。

export function isAdminAuthorized(request: Request): boolean {
  const provided = request.headers.get('x-admin-password');
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) return false;
  if (!provided) return false;

  return provided === expected;
}

export function unauthorizedResponse() {
  return Response.json({ error: '未授权，请重新登录' }, { status: 401 });
}
