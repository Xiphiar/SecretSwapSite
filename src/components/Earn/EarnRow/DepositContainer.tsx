import cn from 'classnames';
import styles from './styles.styl';
import { Button, Icon, Input, Popup } from 'semantic-ui-react';
import React, { useEffect, useState } from 'react';
import { unlockToken } from '../../../utils';
import ScrtTokenBalanceSingleLine from './ScrtTokenBalanceSingleLine';
import BigNumber from 'bignumber.js';
import { unlockJsx } from 'pages/Swap/utils';
import { useStores } from 'stores';
import { createNotification } from 'pages/Exchange/utils';
import { notify } from 'blockchain-bridge';

const buttonStyle = {
  borderRadius: '15px',
  fontSize: '1rem',
  fontWeight: 500,
  height: '30px',
  marginRight: '12px',
  marginLeft: '12px',
  padding: '0.5rem 1rem 1rem 1rem',
  color: '#5F5F6B',
  backgroundColor: 'transparent',
};

const AmountButton = (props: { balance: string; multiplier: string; onChange: CallableFunction }) => {
  return (
    <Button.Group className={cn(styles.amountButton)}>
      <Button
        style={buttonStyle}
        disabled={!props.balance || props.balance === unlockToken}
        onClick={() => {
          changeInput(props.balance, props.multiplier, props.onChange);
        }}
      >
        {`${Number(props.multiplier) * 100}%`}
      </Button>
    </Button.Group>
  );
};

const changeInput = (balance, percentage, onChange) => {
  const event = {
    target: {
      value: new BigNumber(balance.replace(/,/g, ''))
        .multipliedBy(percentage)
        .toFixed(6 /* Earn can only work with down to 6 decimal points */, BigNumber.ROUND_DOWN),
    },
  };
  onChange(event);
};
const DepositContainer = props => {

  useEffect(() => {
    const asyncWrapper = async () => {
    }
    asyncWrapper().then(() => { });
  }, [, props.balance, props.vkey])

  const createViewingKey = () => {
    if(props.deprecated){
      return <></>
    }
    return unlockJsx({
      onClick: async () => {
        try {
          let currency;
          if (props.currency == 'SEFI') {
            currency = props.currency;
          } else {
            currency = props.currency.toLowerCase();
          }

          if (props.userStore.isUnconnected) {
            if(props.userStore.isKeplrWallet){
              props.userStore.signIn();
            }else{
              console.log("Not keplr extention")
              notify("error","It seems like you don't have Keplr extention installed in your browser. Install Keplr, reload the page and try again");
            }
          }
          await props.userStore?.keplrWallet?.suggestToken(props.userStore?.chainId, props.tokenAddress);
          props.userStore.refreshTokenBalanceByAddress(props.tokenAddress);
          props.userStore.refreshRewardsBalances('', props.tokenAddress);
          props.userStore.updateScrtBalance();
        } catch (error) {
          notify("error",`Failed to create key: ${error.toString()}`);
          console.error('Failed to create or refresh key:', error);
        }
      },
    });
  };

  return (
    <div className={`${styles.changeBalance} ${styles[props.theme.currentTheme]}`}>
      <div className={cn(styles.deposit_content)}>
        <div className={cn(styles.balanceRow)}>
          <div className={cn(styles.title)}>{props.title}</div>
        </div>
        <div className={cn(styles.balanceRow)}>
          <div className={cn(styles.h4)}>
            <ScrtTokenBalanceSingleLine
              value={props.balance}
              currency={props.currency}
              price={props.price}
              selected={false}
              balanceText={props.balanceText}
              popupText={props.unlockPopupText}
              // if a createKey function is passed as a prop, use it
              // if not, use the default function above
              // only time passed as prop right now is from infinity row
              // to share same function across multiple infinity row components
              // i.e. vkey for rewards tab, withdraw stake container, unstake container all same function
              createKey={props?.createKey ? props?.createKey : createViewingKey}
            />
            {props.balance?.includes(unlockToken) && !props.deprecated && (
              <Popup
                content={props.unlockPopupText}
                className={styles.iconinfo__popup}
                trigger={<Icon className={styles.icon_info} name="info" circular size="tiny" />}
              />
            )}
          </div>
          <div className={cn(styles.subtitle)}>{props.balanceText}</div>
        </div>
        {
          props.deprecated
            ? <></>
            : <>
                <div>
                  <Input
                    placeholder="0.0"
                    className={`${styles.form} ${styles[props.theme.currentTheme]}`}
                    value={props.value}
                    onChange={props.onChange}
                  >
                    <input style={{ borderRadius: '4px', height: '40px' }} />
                  </Input>
                </div>
                <div className={styles.amountRow}>
                  <AmountButton balance={props.balance} onChange={props.onChange} multiplier={'0.25'} />
                  <AmountButton balance={props.balance} onChange={props.onChange} multiplier={'0.5'} />
                  <AmountButton balance={props.balance} onChange={props.onChange} multiplier={'0.75'} />
                  <AmountButton balance={props.balance} onChange={props.onChange} multiplier={'1'} />
                </div>
              </>
        }
        <div>{props.action}</div>
      </div>
    </div>
  );
};

export default DepositContainer;
