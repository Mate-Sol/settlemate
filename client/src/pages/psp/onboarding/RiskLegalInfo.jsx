import { Gavel, Scale, Link2, ShieldAlert } from 'lucide-react';
import FileUploadField from '../../../components/common/FileUploadField';

const RiskLegalInfo = ({ data, onChange }) => {
    const handleFileChange = (docName) => (fileData) => {
        const updatedDocuments = { ...(data.documents || {}), [docName]: fileData };
        onChange({ ...data, documents: updatedDocuments });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-brand-gradient rounded-lg flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Risk & Legal</h2>
                    <p className="text-gray-500 text-sm">Provide details on existing liabilities and legal structure</p>
                </div>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg mb-6">
                <p className="text-sm text-indigo-800">
                    <strong>Transparency:</strong> Disclosing existing debt and legal structures helps us assess your creditworthiness accurately.
                </p>
            </div>

            <div className="space-y-8">
                <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                        <Gavel className="w-5 h-5 text-brand-purple" />
                        Debt & Facilities
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">

                        <FileUploadField
                            label="Existing debt/facility agreements"
                            category="Risk & Legal"
                            onUpload={handleFileChange('debtAgreements')}
                            existingFile={data.documents?.debtAgreements?.name || data.docData?.debtAgreements?.name}
                        />
                        <FileUploadField
                            label="Existing liens or pledges on receivables"
                            category="Risk & Legal"
                            onUpload={handleFileChange('liensPledges')}
                            existingFile={data.documents?.liensPledges?.name || data.docData?.liensPledges?.name}
                        />
                    </div>
                </div>

                <hr />

                <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                        <Link2 className="w-5 h-5 text-brand-purple" />
                        Operational Structure
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <FileUploadField
                            label="Flow of Funds *"
                            category="Risk & Legal"
                            onUpload={handleFileChange('flowOfFunds')}
                            existingFile={data.documents?.flowOfFunds?.name || data.docData?.flowOfFunds?.name}
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mt-8">
                <p className="text-sm text-amber-800">
                    <strong>Declaration:</strong> By proceeding, you certify that all uploaded documents are true, complete, and accurate representations of your company's status.
                </p>
            </div>
        </div>
    );
};

export default RiskLegalInfo;
