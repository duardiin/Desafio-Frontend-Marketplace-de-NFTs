import { Link } from '@tanstack/react-router'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import radioOther from '@/assets/figma/radio-other-wallet.svg'
import { NETWORK_LABELS } from '@/api/contracts/common'
import type { Wallet } from '@/api/contracts/wallets'
import { WALLET_PROVIDER_LABELS } from '@/api/contracts/wallets'
import { InputField, SelectField, TextAreaField } from '@/components/form/outlined-fields'
import { selectWallet, type CheckoutFormValues } from '@/features/checkout/schema'

interface CollectorFormProps {
  form: UseFormReturn<CheckoutFormValues>
  wallets: Wallet[]
}

/** "Perfil do colecionador" (Figma 11:2862): duas colunas de campos. */
export function CollectorForm({ form, wallets }: CollectorFormProps) {
  const { register, formState } = form
  const errors = formState.errors
  const walletId = useWatch({ control: form.control, name: 'walletId' })
  const wallet = wallets.find((item) => item.id === walletId)

  return (
    <section aria-labelledby="colecionador-titulo" className="flex flex-col gap-3">
      <h2 id="colecionador-titulo" className="text-body-17 font-bold">
        Perfil do colecionador
      </h2>
      <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
        <InputField label="Nome de exibição" required autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
        <InputField label="Nome de usuário" required autoComplete="username" error={errors.username?.message} {...register('username')} />

        <SelectField
          label="Rede"
          required
          placeholder="Selecione uma rede"
          options={(wallet?.networks ?? []).map((network) => ({ value: network, label: NETWORK_LABELS[network] }))}
          error={errors.network?.message}
          hint={wallet ? undefined : 'Escolha a carteira primeiro.'}
          {...register('network')}
        />
        <InputField label="Nome do perfil" required error={errors.profileName?.message} {...register('profileName')} />

        <InputField
          label="Endereço da carteira"
          required
          readOnly
          value={wallet?.address ?? ''}
          title={wallet?.address}
          placeholder="Endereço 0x da carteira"
          hint="Preenchido pela carteira escolhida."
        />
        <InputField
          label="ENS ou carteira secundária (opcional)"
          srOnlyLabel
          className="md:pt-[29px]"
          placeholder="ENS ou carteira secundária (opcional)"
          error={errors.secondaryWallet?.message}
          {...register('secondaryWallet')}
        />

        <SelectField
          label="Tipo de carteira"
          required
          placeholder="Selecione uma carteira"
          options={wallets.map((item) => ({
            value: item.id,
            label: `${WALLET_PROVIDER_LABELS[item.provider]} · ${item.label}`,
          }))}
          error={errors.walletId?.message}
          {...register('walletId', {
            onChange: (event: { target: { value: string } }) =>
              selectWallet(
                (name, value, options) => form.setValue(name, value as never, options),
                form.getValues('network'),
                wallets.find((item) => item.id === event.target.value),
              ),
          })}
        />
        <InputField
          label="Código de indicação"
          placeholder="Opcional"
          error={errors.referralCode?.message}
          {...register('referralCode')}
        />

        <InputField label="E-mail" required type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <div className="flex flex-col">
          <InputField
            label="Nome ENS"
            placeholder="seunome"
            hint="Opcional. Domínio .eth"
            error={errors.ensName?.message}
            {...register('ensName')}
          />
        </div>
      </div>

      {/* O rascunho do pagamento fica salvo: ao voltar das carteiras, o formulário é restaurado. */}
      <Link
        to="/carteiras"
        className="mt-3 flex w-fit items-center gap-2 rounded-sm text-body-15 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <img src={radioOther} alt="" width={15} height={15} />
        Usar outra carteira?
      </Link>

      <TextAreaField
        label="Observação do colecionador (opcional)"
        className="mt-3 md:max-w-[350px]"
        error={errors.note?.message}
        {...register('note')}
      />
    </section>
  )
}
