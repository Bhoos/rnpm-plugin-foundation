Version: 1
Description: Make the app appear full screen
---------
        if (hasFocus) {
            int flag = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN;
            if (android.os.Build.VERSION.SDK_INT >= 19) {
                flag |= View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
            }

            getWindow().getDecorView().setSystemUiVisibility(flag);
        }