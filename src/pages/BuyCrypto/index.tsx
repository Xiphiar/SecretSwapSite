import React, { useState, useEffect } from 'react';
import { BaseContainer, PageContainer } from 'components';
import { ConvertCoin } from './components';
import { observer } from 'mobx-react';
import { useStores } from 'stores';
import { unlockToken, valueToDecimals } from 'utils';
import { unlockJsx } from 'components/Header/utils';
import { notify } from '../../blockchain-bridge/scrt/utils';
import './style.scss';
import { serviceUnwrapToken, serviceWrapToken } from 'services/wrapToken';
import { SwapToken } from 'pages/TokenModal/types/SwapToken';

const SSCRT: SwapToken = {
  address: globalThis.config.SSCRT_CONTRACT,
  symbol: 'SSCRT',
  decimals: 6,
  balance: '0',
};

export const BuyCrypto = observer(() => {
  const { theme, user } = useStores();
  const [amountWrap, setAmountWrap] = useState<string>('');
  const [amountUnwrap, setAmountUnwrap] = useState<string>('');
  const [unwrapLoading, setUnwrapLoading] = useState<boolean>(false);
  const [wrapLoading, setWrapLoading] = useState<boolean>(false);
  const [tokenSelected, setTokenSelected] = useState<SwapToken>(SSCRT);

  const SCRT: SwapToken = {
    address: '',
    balance: user.balanceSCRT,
    symbol: 'SCRT',
    // decimals 0 because it's already parsed to it's decimals
    decimals: 0,
  };

  const transakConfig = '&cryptoCurrencyCode=SCRT' +
      '&defaultCryptoAmount=15' +
      '&redirectURL=app.secretswap.net/redir_transac' +
      '&hideMenu=true' +
      '&exchangeScreenTitle=%20' +
      '&themeColor=008800';

  useEffect(() => {
    const SSCRT: SwapToken = {
      address: globalThis.config.SSCRT_CONTRACT,
      symbol: 'SSCRT',
      decimals: 6,
      balance: user.balanceToken[globalThis.config.SSCRT_CONTRACT],
    };
    setTokenSelected(SSCRT);
  }, [user.balanceToken[globalThis.config.SSCRT_CONTRACT]]);

  async function wrapToken(amount: string, token: SwapToken) {
    setWrapLoading(true);

    //inputs 1 -> 1000000
    const amount_convert = valueToDecimals(amount, token.decimals);

    await serviceWrapToken(amount_convert, token, user);

    setAmountWrap('');
    setWrapLoading(false);
  }

  async function unwrapToken(amount: string, token: SwapToken) {
    setUnwrapLoading(true);

    //inputs 1 -> 1000000
    const amount_convert = valueToDecimals(amount, token.decimals);

    await serviceUnwrapToken(amount_convert, token, user);

    setAmountUnwrap('');
    setUnwrapLoading(false);
  }

  const createVK = async (token: SwapToken) => {
    try {
      await user.keplrWallet.suggestToken(user.chainId, token.address);
      await user.updateBalanceForRewardsToken(token.address);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <BaseContainer>
      <PageContainer>
        <main className={`${theme.currentTheme} buy-base-container`} style={{marginTop: '2rem'}}>
          <section className="balances-container">
            <div>
              <p>SCRT</p>
              <p>
                <strong>{user.balanceSCRT}</strong>
              </p>
            </div>
            <div>
              <p>sSCRT</p>
              <p>
                {unlockToken === user.balanceToken[globalThis.config.SSCRT_CONTRACT] ? (
                  unlockJsx({ onClick: () => createVK(tokenSelected) })
                ) : (
                  <strong>{user.balanceToken[globalThis.config.SSCRT_CONTRACT]}</strong>
                )}
              </p>
            </div>
          </section>
          <section className="buy-convert-grid">
            {/* <div className="transak-container">
              <h1>Buy</h1>
              <div>
                <iframe
                  height="780"
                  width="450"
                  title="Transak On/Off Ramp Widget (Website)"
                  src={globalThis.config.TRANSAK_URL + transakConfig}
                  frameBorder="no"
                  allowFullScreen={false}
                />
              </div>
            </div> */}
            <div className="convert-container">
              <h1>Convert</h1>
              <ConvertCoin
                title="Wrap"
                description="Convert SCRT to the privacy preserving sSCRT token."
                theme={theme.currentTheme}
                learn_link=""
                token={SCRT}
                onSubmit={() => wrapToken(amountWrap, tokenSelected)}
                amount={amountWrap}
                notify={notify}
                loading={wrapLoading}
                setAmount={setAmountWrap}
              />
              <ConvertCoin
                createVK={() => createVK(tokenSelected)}
                style={{ marginTop: '30px' }}
                title="Unwrap"
                description="Convert sSCRT to the native Secret Network SCRT public token."
                theme={theme.currentTheme}
                learn_link=""
                token={tokenSelected}
                onSubmit={() => unwrapToken(amountUnwrap, tokenSelected)}
                amount={amountUnwrap}
                notify={notify}
                loading={unwrapLoading}
                setAmount={setAmountUnwrap}
              />
            </div>
          </section>
        </main>
      </PageContainer>
    </BaseContainer>
  );
});
