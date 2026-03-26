import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mustChangePassword, setMustChangePassword] = useState(false);

    const login = async (token, user) => {
        setIsLoading(true);
        setUserToken(token);
        setUserInfo(user);

        if (user.must_change_password) {
            setMustChangePassword(true);
        } else {
            setMustChangePassword(false);
        }

        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userInfo', JSON.stringify(user));
        setIsLoading(false);
    };

    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        setMustChangePassword(false);
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userInfo');
        setIsLoading(false);
    };

    const completeForceChangePassword = async () => {
        setMustChangePassword(false);
        if (userInfo) {
            const updatedUser = { ...userInfo, must_change_password: 0 };
            setUserInfo(updatedUser);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(updatedUser));
        }
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let token = await SecureStore.getItemAsync('userToken');
            let user = await SecureStore.getItemAsync('userInfo');

            if (token) {
                setUserToken(token);
                if (user) {
                    const parsedUser = JSON.parse(user);
                    setUserInfo(parsedUser);
                    if (parsedUser.must_change_password) {
                        setMustChangePassword(true);
                    }
                }
            }
            setIsLoading(false);
        } catch (e) {
            console.log(`isLoggedIn error: ${e}`);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, userToken, userInfo, mustChangePassword, completeForceChangePassword }}>
            {children}
        </AuthContext.Provider>
    );
};
