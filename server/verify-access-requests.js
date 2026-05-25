// server/verify-access-requests.js

async function run() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('--- STARTING SHNOORDRIVE ACCESS REQUESTS INTEGRATION TEST ---');

  const randomSuffix = Math.floor(Math.random() * 1000000);
  const parentEmail = `owner_${randomSuffix}@gmail.com`;
  const childEmail = `requester_${randomSuffix}@gmail.com`;
  const password = 'Password123!';

  // 1. Register and Log in Parent Account (Owner)
  console.log(`1. Registering Owner: ${parentEmail}...`);
  let res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Owner User', email: parentEmail, password })
  });
  if (!res.ok) throw new Error(`Owner registration failed: ${res.status}`);
  const parentAuth = await res.json();
  const parentToken = parentAuth.token;
  console.log('Owner registered successfully.');

  // 2. Register and Log in Child Account (Requester)
  console.log(`2. Registering Requester: ${childEmail}...`);
  res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Requester User', email: childEmail, password })
  });
  if (!res.ok) throw new Error(`Requester registration failed: ${res.status}`);
  const childAuth = await res.json();
  const childToken = childAuth.token;
  console.log('Requester registered successfully.');

  // 3. Upload a file as Owner
  console.log('3. Uploading file as Owner...');
  const formData = new FormData();
  const fileBlob = new Blob(['Private test content!'], { type: 'text/plain' });
  formData.append('file', fileBlob, 'secret_plans.txt');

  res = await fetch(`${BASE_URL}/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${parentToken}` },
    body: formData
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`File upload failed: ${res.status} - ${errText}`);
  }
  const uploadObj = await res.json();
  const ownerFile = uploadObj.file;
  console.log(`Uploaded file: ${ownerFile.fileName} (ID: ${ownerFile._id})`);

  // 4. Generate a PRIVATE share link as Owner
  console.log('4. Generating private share link...');
  res = await fetch(`${BASE_URL}/files/${ownerFile._id}/share`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${parentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ visibility: 'private' })
  });
  if (!res.ok) throw new Error(`Share generation failed: ${res.status}`);
  const shareObj = await res.json();
  const shareId = shareObj.shareId;
  console.log(`Share URL generated successfully. Share ID: ${shareId}, Visibility: ${shareObj.visibility}`);
  if (shareObj.visibility !== 'private') {
    throw new Error(`Expected visibility to be private, got ${shareObj.visibility}`);
  }

  // 5. Access the shared link as an Unauthenticated Guest
  console.log('5. Accessing private shared link as Unauthenticated Guest...');
  res = await fetch(`${BASE_URL}/shared/${shareId}`, {
    method: 'GET'
  });
  if (!res.ok) throw new Error(`Guest shared link retrieval failed: ${res.status}`);
  const guestRes = await res.json();
  console.log('Guest Response:', JSON.stringify(guestRes));
  if (guestRes.success !== false || guestRes.requiresAuth !== true) {
    throw new Error('Verification failed: Guest should be redirected to auth/login.');
  }
  console.log('✓ Success: Guest blocked and requiresAuth is true.');

  // 6. Access the shared link as the Authenticated Requester (No Permission yet)
  console.log('6. Accessing private shared link as Authenticated Requester (no access yet)...');
  res = await fetch(`${BASE_URL}/shared/${shareId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${childToken}` }
  });
  if (!res.ok) throw new Error(`Requester shared link retrieval failed: ${res.status}`);
  const reqAccessRes = await res.json();
  console.log('Requester Response:', JSON.stringify(reqAccessRes));
  if (reqAccessRes.success !== false || reqAccessRes.requiresAccess !== true || reqAccessRes.hasPendingRequest !== false) {
    throw new Error('Verification failed: Requester should receive requiresAccess = true and no pending request.');
  }
  console.log('✓ Success: Requester blocked and requiresAccess is true with hasPendingRequest = false.');

  // 7. Submit Access Request as Requester
  console.log('7. Submitting access request...');
  res = await fetch(`${BASE_URL}/share/request-access`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${childToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      shareId,
      requestedRole: 'editor',
      message: 'Need to edit the secret plans please!'
    })
  });
  if (!res.ok) throw new Error(`Request submission failed: ${res.status}`);
  const submitRes = await res.json();
  console.log('Submit Response:', JSON.stringify(submitRes));
  if (submitRes.success !== true || submitRes.request.status !== 'pending') {
    throw new Error('Verification failed: Access request not set to pending.');
  }
  console.log('✓ Success: Access request created as pending.');

  // 8. Access the shared link as Requester again to verify pending status
  console.log('8. Re-accessing shared link as Requester to verify pending status...');
  res = await fetch(`${BASE_URL}/shared/${shareId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${childToken}` }
  });
  if (!res.ok) throw new Error(`Shared link retrieval failed: ${res.status}`);
  const reqAccessRes2 = await res.json();
  console.log('Requester Response after requesting:', JSON.stringify(reqAccessRes2));
  if (reqAccessRes2.success !== false || reqAccessRes2.requiresAccess !== true || reqAccessRes2.hasPendingRequest !== true || reqAccessRes2.requestStatus !== 'pending') {
    throw new Error('Verification failed: Should indicate pending request.');
  }
  console.log('✓ Success: Access page shows pending request status.');

  // 9. Retrieve Access Requests as Owner
  console.log('9. Retrieving access requests as Owner...');
  res = await fetch(`${BASE_URL}/share/access-requests`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${parentToken}` }
  });
  if (!res.ok) throw new Error(`Access requests retrieval failed: ${res.status}`);
  const ownerRequests = await res.json();
  console.log('Owner pending requests count:', ownerRequests.requests.length);
  const targetRequest = ownerRequests.requests.find(r => r.fileId._id.toString() === ownerFile._id.toString());
  if (!targetRequest) {
    throw new Error('Verification failed: Access request not found in Owner list.');
  }
  console.log('Found request:', JSON.stringify(targetRequest));
  if (targetRequest.requesterId.email !== childEmail || targetRequest.requestedRole !== 'editor' || targetRequest.message !== 'Need to edit the secret plans please!') {
    throw new Error('Verification failed: Requester metadata does not match.');
  }
  console.log('✓ Success: Owner correctly sees the pending request with full metadata.');

  // 10. Approve Access Request as Owner
  console.log(`10. Approving request ID: ${targetRequest._id} as Owner...`);
  res = await fetch(`${BASE_URL}/share/access-requests/${targetRequest._id}/approve`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${parentToken}` }
  });
  if (!res.ok) throw new Error(`Approval failed: ${res.status}`);
  const approveRes = await res.json();
  console.log('Approve response:', JSON.stringify(approveRes));
  if (approveRes.success !== true || approveRes.request.status !== 'approved') {
    throw new Error('Verification failed: Request status not updated to approved.');
  }
  console.log('✓ Success: Request status updated to approved.');

  // 11. Access the shared link as Requester now that they are approved
  console.log('11. Accessing shared link again as Requester (now approved)...');
  res = await fetch(`${BASE_URL}/shared/${shareId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${childToken}` }
  });
  if (!res.ok) throw new Error(`Shared link retrieval failed: ${res.status}`);
  const childSuccessRes = await res.json();
  console.log('Response:', JSON.stringify(childSuccessRes));
  if (childSuccessRes.success !== true || !childSuccessRes.file) {
    throw new Error('Verification failed: Approved user is blocked from viewing the file.');
  }
  console.log('✓ Success: Approved user successfully fetched the file data.');

  // 12. Verify file is cloned to requester's My Drive
  console.log('12. Checking Requester Drive for cloned file...');
  res = await fetch(`${BASE_URL}/drive`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${childToken}` }
  });
  if (!res.ok) throw new Error(`Requester drive fetch failed: ${res.status}`);
  const childDrive = await res.json();
  const cloned = childDrive.files.find(f => f.fileUrl === ownerFile.fileUrl);
  if (!cloned) {
    throw new Error('Verification failed: Approved file did not clone to Requester My Drive.');
  }
  console.log(`✓ Success: Found cloned file ${cloned.fileName} in Requester Drive!`);


  // --- REJECT FLOW ---
  console.log('\n--- TESTING REJECTION FLOW ---');
  // 13. Upload second file as Owner
  const formData2 = new FormData();
  formData2.append('file', new Blob(['Reject test content!'], { type: 'text/plain' }), 'private_docs.txt');
  res = await fetch(`${BASE_URL}/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${parentToken}` },
    body: formData2
  });
  const ownerFile2 = (await res.json()).file;

  // 14. Share second file as private
  res = await fetch(`${BASE_URL}/files/${ownerFile2._id}/share`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${parentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ visibility: 'private' })
  });
  const shareId2 = (await res.json()).shareId;

  // 15. Request access
  res = await fetch(`${BASE_URL}/share/request-access`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${childToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ shareId: shareId2, requestedRole: 'viewer', message: 'Reject me' })
  });
  const submitRes2 = await res.json();

  // 16. Owner retrieves requests and rejects this one
  res = await fetch(`${BASE_URL}/share/access-requests`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${parentToken}` }
  });
  const requests2 = await res.json();
  const targetRequest2 = requests2.requests.find(r => r.fileId._id.toString() === ownerFile2._id.toString());

  console.log(`Rejecting request ID: ${targetRequest2._id} as Owner...`);
  res = await fetch(`${BASE_URL}/share/access-requests/${targetRequest2._id}/reject`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${parentToken}` }
  });
  if (!res.ok) throw new Error(`Rejection failed: ${res.status}`);
  const rejectRes = await res.json();
  if (rejectRes.success !== true || rejectRes.request.status !== 'rejected') {
    throw new Error('Verification failed: Request status not updated to rejected.');
  }

  // 17. Verify Requester is still blocked and status is rejected
  res = await fetch(`${BASE_URL}/shared/${shareId2}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${childToken}` }
  });
  const reqAccessRes3 = await res.json();
  if (reqAccessRes3.success !== false || reqAccessRes3.requiresAccess !== true || reqAccessRes3.requestStatus !== 'rejected') {
    throw new Error('Verification failed: Requester should be blocked and show rejected status.');
  }
  console.log('✓ Success: Rejected user remains blocked with requestStatus = rejected.');

  console.log('\n--- ALL ACCESS REQUEST INTEGRATION VERIFICATIONS PASSED SUCCESSFULLY ---');
}

run().catch(err => {
  console.error('× VERIFICATION FAILED:', err);
  process.exit(1);
});
