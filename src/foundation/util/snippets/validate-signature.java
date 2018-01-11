Version: 1
Description: In release mode check if the bundle is valid
------------
  private void validateSignature() {
    if (BuildConfig.BUILD_TYPE.equalsIgnoreCase("release")) {
      try {
        byte[] buffer = new byte[10240];
        InputStream inp = getAssets().open("index.android.bundle");
        MessageDigest digest = MessageDigest.getInstance("MD5");
        while (inp.available() > 0) {
          int length = inp.read(buffer);
          digest.update(buffer, 0, length);
        }
        digest.update("{{SALT}}".getBytes("UTF-8"));
        String md5 = new BigInteger(1, digest.digest()).toString(16);

        ApplicationInfo ai = getPackageManager().getApplicationInfo(getPackageName(), PackageManager.GET_META_DATA);
        String signature = ai.metaData.getString("BUNDLE-SIGNATURE");
        if (!signature.equals(md5)) {
          throw new RuntimeException("Invalid Javascript Bundle Signature");
        }
      } catch (IOException e) {
        throw new RuntimeException("Javascript bundle not found");
      } catch (NoSuchAlgorithmException e) {
        throw new RuntimeException("Could not generate signature");
      } catch (PackageManager.NameNotFoundException e) {
        throw new RuntimeException("Signature not found in manifest");
      }
    }
  }