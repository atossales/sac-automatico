'use client';

interface AccountFilterItem {
  accountId: string;
  accountName: string;
}

interface AccountFilterProps {
  accounts: AccountFilterItem[];
  selectedAccountId: string | null;
  onSelect: (accountId: string) => void;
}

export function AccountFilter({
  accounts,
  selectedAccountId,
  onSelect,
}: AccountFilterProps): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
      }}
      role="group"
      aria-label="Filtrar por conta"
    >
      {accounts.map((account) => {
        const isSelected = account.accountId === selectedAccountId;
        return (
          <button
            key={account.accountId}
            type="button"
            onClick={() => onSelect(account.accountId)}
            aria-pressed={isSelected}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              minHeight: '44px',
              transition: 'border-color 0.15s ease',
              background: isSelected ? 'var(--color-primary)' : 'transparent',
              color: isSelected ? 'white' : 'var(--color-text-muted)',
              border: isSelected ? 'none' : '1px solid var(--color-border)',
              outline: 'none',
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline =
                '2px solid var(--color-primary)';
              (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline = 'none';
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'var(--color-text-muted)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
              }
            }}
          >
            {account.accountName}
          </button>
        );
      })}
    </div>
  );
}
