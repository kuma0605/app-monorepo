import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {Input, Button, WhiteSpace, Icon, Form} from '@ant-design/react-native';
import {useTheme} from '@/hooks/useTheme';
import {useAppDispatch} from '@/store/hooks';
import {login} from '@/store/slices/userSlice';

export default function LoginScreen() {
  const {colors} = useTheme();
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const [showPassword, setShowPassword] = useState(false);
  const initialValues = {
    username: '',
    password: '',
  };
  const keyboardAvoidingViewStyle = useMemo(
    () => [styles.keyboardAvoidingView, {backgroundColor: colors.background}],
    [colors.background],
  );

  /** Seed：无校验假登录，任意点击即可进入首页。 */
  const handleLogin = async () => {
    const values = form.getFieldsValue();
    const username =
      (values?.username as string | undefined)?.trim() || 'Guest';

    dispatch(
      login({
        profile: {name: username},
        accessToken: 'dev-token',
      }),
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={keyboardAvoidingViewStyle}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <View style={styles.heroHeader}>
          <Image
            source={require('@/assets/login/bg.png')}
            style={styles.heroBgImage}
            resizeMode="cover"
          />
          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitle}>RNOH Seed</Text>
            <Text style={styles.heroSubtitle}>React Native OpenHarmony</Text>
          </View>
        </View>
        <View style={styles.formWrapper}>
          <Form
            form={form}
            initialValues={initialValues}
            styles={{
              Body: {borderTopWidth: 0, borderBottomWidth: 0},
              BodyBottomLine: {borderBottomWidth: 0},
            }}>
            <Form.Item
              name="username"
              normalize={v => v?.trim()}
              style={styles.formItem}
              styles={{Line: {borderBottomWidth: 0}}}>
              <Input
                prefix={<Icon name="user" color={colors.textSecondary} />}
                type="text"
                placeholder="账号（可空）"
                allowClear={true}
              />
            </Form.Item>

            <Form.Item
              name="password"
              normalize={v => v?.trim()}
              style={styles.formItem}
              styles={{Line: {borderBottomWidth: 0}}}>
              <Input
                prefix={<Icon name="lock" color={colors.textSecondary} />}
                type={showPassword ? 'text' : 'password'}
                placeholder="密码（可空）"
                suffix={
                  <Icon
                    name={showPassword ? 'eye' : 'eye-invisible'}
                    onPress={() => setShowPassword(prev => !prev)}
                  />
                }
              />
            </Form.Item>

            <WhiteSpace size="xl" style={{backgroundColor: 'white'}} />
            <Form.Item noStyle={true}>
              <Button
                type="primary"
                onPress={handleLogin}
                style={styles.loginBtn}>
                登录
              </Button>
            </Form.Item>
          </Form>

          <WhiteSpace size="xl" />
          <Text style={styles.hint}>Seed 模式：点击登录即可进入，无需校验</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: 'white',
  },
  heroHeader: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  heroBgImage: {
    width: '100%',
    height: '100%',
  },
  heroTitleWrap: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  formWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 40,
  },
  formItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
    marginBottom: 1,
  },
  loginBtn: {
    backgroundColor: '#0C68F2',
  },
  hint: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    marginTop: 8,
  },
});
