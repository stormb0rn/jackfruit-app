import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAppStore from './stores/appStore';
import IdentityUpload from './pages/IdentityUpload';
import EditLook from './pages/EditLook';
import Templates from './pages/Templates';
import CreatePost from './pages/CreatePost';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import ConfigAdmin from './pages/ConfigAdmin';
import MobileFrameWrapper from './components/MobileFrameWrapper';

function MainApp() {
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

function App() {
  return (
    <BrowserRouter>
      <MobileFrameWrapper>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/upload" element={
            <View style={styles.app}>
              <IdentityUpload />
            </View>
          } />
          <Route path="/edit-look" element={
            <View style={styles.app}>
              <EditLook />
            </View>
          } />
          <Route path="/templates" element={
            <View style={styles.app}>
              <Templates />
            </View>
          } />
          <Route path="/create-post" element={
            <View style={styles.app}>
              <CreatePost />
            </View>
          } />
          <Route path="/feed" element={
            <View style={styles.app}>
              <Feed />
            </View>
          } />
          <Route path="/profile" element={
            <View style={styles.app}>
              <Profile />
            </View>
          } />
          <Route path="/admin" element={
            <View style={styles.app}>
              <ConfigAdmin />
            </View>
          } />
        </Routes>
      </MobileFrameWrapper>
    </BrowserRouter>
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
