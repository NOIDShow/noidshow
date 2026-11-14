// Keep existing opt-outs and group memberships when a signup is retried.
export async function syncSender(email, key, group) {
  if (!key || !group) throw new Error('Sender integration is not configured');

  async function call(path, method = 'GET', body) {
    const response = await fetch('https://api.sender.net/v2/' + path, {
      method,
      headers: {
        Authorization: 'Bearer ' + key,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(10000),
    });
    return response;
  }

  const path = 'subscribers/' + encodeURIComponent(email);
  let response = await call(path);
  if (response.status === 404) {
    response = await call('subscribers', 'POST', {
      email, groups: [group], trigger_automation: false,
    });
    if (response.ok) {
      const result = await response.json();
      if (!result.data?.id) throw new Error('Sender returned no subscriber');
      return 'created';
    }
    // Another request may have created this subscriber concurrently.
    if (response.status !== 409 && response.status !== 422) {
      throw new Error('Sender create failed: ' + response.status);
    }
    response = await call(path);
  }
  if (!response.ok) throw new Error('Sender lookup failed: ' + response.status);
  const { data } = await response.json();
  if (!data?.id || !data.status?.email) throw new Error('Invalid Sender subscriber response');
  if (data.status.email.toLowerCase() !== 'active') return 'suppressed';
  if (data.subscriber_tags?.some((tag) => tag.id === group)) return 'existing';

  response = await call('subscribers/groups/' + encodeURIComponent(group), 'POST', {
    subscribers: [email], trigger_automation: false,
  });
  if (!response.ok) throw new Error('Sender group update failed: ' + response.status);
  const result = await response.json();
  if (result.success !== true || result.message?.non_existing_subscribers?.length) {
    throw new Error('Sender did not confirm the group update');
  }
  return 'group_added';
}
