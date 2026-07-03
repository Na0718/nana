// api/debug-perms.js
// 临时调试端点 — 查看 on_990886081df9fe9ad05775a4d83877dc 权限查询结果

const { getUserPermissions } = require('./_lib/auth');
const { ok, fail } = require('./_lib/response');

module.exports = async (req, res) => {
  const openId = 'ou_990886081df9fe9ad05775a4d83877dc';
  
  console.log('=== DEBUG START ===');
  console.log('ADMIN_OPEN_IDS:', process.env.ADMIN_OPEN_IDS);
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('Target openId:', openId);

  try {
    const result = await getUserPermissions(openId);
    console.log('getUserPermissions result:', JSON.stringify(result));
    console.log('=== DEBUG END ===');
    return ok(res, {
      open_id: openId,
      env_admin_ids: process.env.ADMIN_OPEN_IDS,
      result: result,
    }, req);
  } catch (err) {
    console.error('getUserPermissions error:', err.message, err.stack);
    return fail(res, `权限查询失败: ${err.message}`, 500, req);
  }
};
