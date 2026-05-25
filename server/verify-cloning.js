async function run() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('--- STARTING SHNOORDRIVE PARENT/CHILD CLONING INTEGRATION TEST ---');

  const randomSuffix = Math.floor(Math.random() * 1000000);
  const parentEmail = `parent_${randomSuffix}@gmail.com`;
  const childEmail = `child_${randomSuffix}@gmail.com`;
  const password = 'Password123!';

  // 1. Register and Log in Parent Account
  console.log(`1. Registering Parent: ${parentEmail}...`);
  let res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Parent User', email: parentEmail, password })
  });
  if (!res.ok) throw new Error(`Parent registration failed: ${res.status}`);
  const parentAuth = await res.json();
  const parentToken = parentAuth.token;
  console.log('Parent registered & logged in successfully.');

  // 2. Register and Log in Child Account
  console.log(`2. Registering Child: ${childEmail}...`);
  res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Child User', email: childEmail, password })
  });
  if (!res.ok) throw new Error(`Child registration failed: ${res.status}`);
  const childAuth = await res.json();
  const childToken = childAuth.token;
  console.log('Child registered & logged in successfully.');

  // 3. Upload a file as Parent
  console.log('3. Uploading file as Parent using native FormData...');
  const formData = new FormData();
  const fileBlob = new Blob(['Cloning test content!'], { type: 'application/pdf' });
  formData.append('file', fileBlob, 'cloned_resume.pdf');

  res = await fetch(`${BASE_URL}/files/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${parentToken}`
    },
    body: formData
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`File upload failed: ${res.status} - ${errText}`);
  }
  const uploadObj = await res.json();
  const parentFile = uploadObj.file;
  console.log(`Uploaded file: ${parentFile.fileName} (ID: ${parentFile._id}, size: ${parentFile.size})`);

  // 4. Generate a public share link as Parent
  console.log(`4. Generating share link for file ID: ${parentFile._id}...`);
  res = await fetch(`${BASE_URL}/files/${parentFile._id}/share`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${parentToken}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`Share generation failed: ${res.status}`);
  const shareObj = await res.json();
  const shareId = shareObj.shareId;
  console.log(`Share URL generated successfully. Share ID: ${shareId}`);

  // 5. Open the shared link as the Authenticated Child Account
  console.log(`5. Accessing shared link ${shareId} as Authenticated Child User...`);
  res = await fetch(`${BASE_URL}/shared/${shareId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${childToken}`
    }
  });
  if (!res.ok) throw new Error(`Child shared link retrieval failed: ${res.status}`);
  const sharedRes = await res.json();
  console.log('Shared link access successful.');

  // 6. Verify child has the file in their My Drive (via GET /api/drive)
  console.log('6. Checking Child Drive contents to verify automatic cloning...');
  res = await fetch(`${BASE_URL}/drive`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${childToken}`
    }
  });
  if (!res.ok) throw new Error(`Child drive retrieval failed: ${res.status}`);
  const childDrive = await res.json();
  const clonedFiles = childDrive.files.filter(f => f.fileUrl === parentFile.fileUrl);
  
  if (clonedFiles.length === 0) {
    throw new Error('Verification failed: The shared file was NOT copied to the child account drive.');
  }
  const childClonedFile = clonedFiles[0];
  console.log(`✓ Success: Found copied file in Child Drive! Name: ${childClonedFile.fileName}, ID: ${childClonedFile._id}`);

  // 7. Verify Child storage limit is updated
  console.log('7. Verifying Child storage usage update...');
  res = await fetch(`${BASE_URL}/user/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${childToken}`
    }
  });
  if (!res.ok) throw new Error(`Child profile retrieval failed: ${res.status}`);
  const childProfile = await res.json();
  console.log(`Child Storage Used: ${childProfile.user.storageUsed} bytes (File size: ${parentFile.size} bytes)`);
  if (childProfile.user.storageUsed !== parentFile.size) {
    throw new Error(`Verification failed: Expected Child storageUsed to be ${parentFile.size}, got ${childProfile.user.storageUsed}`);
  }
  console.log('✓ Success: Storage usage updated correctly!');

  // 8. Delete the file as Child
  console.log(`8. Soft-deleting the copied file from Child Drive (File ID: ${childClonedFile._id})...`);
  res = await fetch(`${BASE_URL}/files/${childClonedFile._id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${childToken}`
    }
  });
  if (!res.ok) throw new Error(`Soft-deleting child file failed: ${res.status}`);
  console.log('Soft-delete completed.');

  // 9. Verify the file is no longer in Child's active drive
  console.log('9. Checking Child active Drive contents again...');
  res = await fetch(`${BASE_URL}/drive`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${childToken}`
    }
  });
  const childDriveAfterDelete = await res.json();
  const activeCloned = childDriveAfterDelete.files.filter(f => f.fileUrl === parentFile.fileUrl);
  if (activeCloned.length > 0) {
    throw new Error('Verification failed: Soft-deleted file still present in Child active drive.');
  }
  console.log('✓ Success: File is removed from Child active drive.');

  // 10. Verify Parent's original file is still intact and unaffected
  console.log('10. Checking Parent Drive to verify original file is intact...');
  res = await fetch(`${BASE_URL}/drive`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${parentToken}`
    }
  });
  const parentDrive = await res.json();
  const activeParentFile = parentDrive.files.find(f => f._id === parentFile._id);
  if (!activeParentFile) {
    throw new Error('Verification failed: Parent original file was deleted/modified!');
  }
  console.log(`✓ Success: Parent original file is completely intact. Name: ${activeParentFile.fileName}`);

  console.log('--- ALL INTEGRATION VERIFICATIONS PASSED SUCCESSFULLY ---');
}

run().catch(err => {
  console.error('× VERIFICATION FAILED:', err);
  process.exit(1);
});
