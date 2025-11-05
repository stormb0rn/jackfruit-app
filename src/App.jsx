import React from 'react';
import { View, StyleSheet } from 'react-native';
import useAppStore from './stores/appStore';
import IdentityUpload from './pages/IdentityUpload';
import EditLook from './pages/EditLook';
import Templates from './pages/Templates';
import CreatePost from './pages/CreatePost';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import ConfigAdmin from './pages/ConfigAdmin';

function App() {
  const currentStep = useAppStore((state) => state.currentStep);

  const renderPage = () => {
    switch (currentStep) {
      case 'upload':
        return <IdentityUpload />;
      case 'edit-look':
        return <EditLook />;
      case 'templates':
        return <Templates />;
      case 'create-post':
        return <CreatePost />;
      case 'feed':
        return <Feed />;
      case 'profile':
        return <Profile />;
      case 'config-admin':
        return <ConfigAdmin />;
      default:
        return <IdentityUpload />;
    }
  };

  return (
    <View style={styles.app}>
      {renderPage()}
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default App;
