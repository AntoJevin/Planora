import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c00e1ea72fc844cfad36beec6d8ab1a8',
  appName: 'TaskFlow - Daily Productivity',
  webDir: 'dist',
  server: {
    url: 'https://c00e1ea7-2fc8-44cf-ad36-beec6d8ab1a8.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
  },
};

export default config;