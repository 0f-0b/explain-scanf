import * as React from '../../../@types/react@17.0.34/index.d.ts'

import {Icon} from './icons.d.ts'

type Size = 'small' | 'medium' | 'large'

export interface OcticonProps {
  'aria-label'?: string
  children?: React.ReactElement<any>
  className?: string
  fill?: string
  icon?: Icon
  size?: number | Size
  verticalAlign?: 'middle' | 'text-bottom' | 'text-top' | 'top' | 'unset'
}

/**
 * @deprecated Use icon components on their own instead (e.g. `<Octicon icon={AlertIcon} />` → `<AlertIcon />`)
 */
declare const Octicon: React.FC<OcticonProps>

export default Octicon

export * from './icons.d.ts'
